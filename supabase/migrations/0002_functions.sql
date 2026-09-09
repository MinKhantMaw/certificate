-- 0002_functions.sql
-- Run after 0001_schema.sql.
-- These exist because they are multi-table writes. Running them as separate
-- calls from the browser risks a certificate with no approval rows, or trainees
-- created for a batch that never got marked approved.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Imported spreadsheet dates are free text; a bad value must not abort issuance.
create or replace function public.try_date(p_value text)
returns date
language plpgsql
immutable
as $$
begin
  return nullif(btrim(p_value), '')::date;
exception when others then
  return null;
end;
$$;

-- Mirrors generateShortCertificateId() in src/utils/index.ts:
-- 9 random chars from a 32-char Crockford-style alphabet plus a checksum char.
create or replace function public.generate_short_id()
returns text
language plpgsql
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  bytes    bytea := gen_random_bytes(9);
  idx      integer;
  total    integer := 0;
  body     text := '';
  i        integer;
begin
  for i in 0..8 loop
    -- 256 is divisible by 32, so this modulo is unbiased.
    idx   := get_byte(bytes, i) % 32;
    total := total + idx;
    body  := body || substr(alphabet, idx + 1, 1);
  end loop;
  return body || substr(alphabet, (total % 32) + 1, 1);
end;
$$;

create or replace function public.generate_unique_short_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  i    integer;
begin
  for i in 1..10 loop
    v_id := public.generate_short_id();
    if not exists (select 1 from public.certificates where short_id = v_id) then
      return v_id;
    end if;
  end loop;
  raise exception 'Unable to generate a unique certificate ID. Please try again.';
end;
$$;

-- Atomic replacement for the client's `existingCertificates.length + 1`.
create or replace function public.next_certificate_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year  integer := extract(year from now())::integer;
  v_value integer;
begin
  insert into public.certificate_counters as c (year, last_value)
  values (v_year, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning c.last_value into v_value;

  return 'CERT-' || v_year || '-' || lpad(v_value::text, 6, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- issue_certificates: replaces storage.issueCertificates()
-- ---------------------------------------------------------------------------
create or replace function public.issue_certificates(
  p_program_id  uuid,
  p_trainee_ids uuid[],
  p_template_id uuid
)
returns setof public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program  public.training_programs;
  v_template public.certificate_templates;
  v_trainee  public.trainees;
  v_cert     public.certificates;
  v_approver uuid;
  v_short    text;
begin
  select * into v_program from public.training_programs where id = p_program_id;
  if not found then
    raise exception 'Training program not found.';
  end if;
  if v_program.status <> 'COMPLETED' then
    raise exception 'Certificates can only be issued for completed training programs.';
  end if;
  if not (public.is_admin() or auth.uid() = any (v_program.approver_ids)) then
    raise exception 'Not authorised to issue certificates for this program.';
  end if;

  select * into v_template
    from public.certificate_templates
   where id = p_template_id and status = 'ACTIVE';
  if not found then
    raise exception 'Select an active certificate template before issuing certificates.';
  end if;

  for v_trainee in
    select t.*
      from public.trainees t
     where t.training_program_id = p_program_id
       and t.id = any (p_trainee_ids)
       and not exists (select 1 from public.certificates c where c.trainee_id = t.id)
     order by t.created_at
  loop
    v_short := public.generate_unique_short_id();

    insert into public.certificates (
      certificate_number, short_id, recipient_name, certificate_title, course_name,
      issue_date, organization, certificate_type, email, status,
      certificate_template_id, dynamic_data, training_program_id, trainee_id,
      trainer_ids, approver_ids
    )
    values (
      public.next_certificate_number(),
      v_short,
      coalesce(
        nullif(v_trainee.dynamic_data ->> 'name', ''),
        nullif(v_trainee.dynamic_data ->> 'recipient_name', ''),
        v_trainee.recipient_name
      ),
      coalesce(nullif(v_trainee.dynamic_data ->> 'certificate_title', ''), 'Certificate of Completion'),
      coalesce(
        nullif(v_trainee.dynamic_data ->> 'course', ''),
        nullif(v_trainee.dynamic_data ->> 'course_name', ''),
        v_program.name
      ),
      coalesce(
        public.try_date(v_trainee.dynamic_data ->> 'issue_date'),
        public.try_date(v_trainee.dynamic_data ->> 'completion_date'),
        v_program.end_date,
        current_date
      ),
      coalesce(nullif(v_trainee.dynamic_data ->> 'organization', ''), v_program.organization),
      coalesce(nullif(v_trainee.dynamic_data ->> 'certificate_type', ''), 'completion'),
      v_trainee.email,
      'PENDING_APPROVAL',
      v_template.id,
      v_trainee.dynamic_data || jsonb_build_object('certificate_id', v_short, 'short_id', v_short),
      p_program_id,
      v_trainee.id,
      v_program.trainer_ids,
      v_program.approver_ids
    )
    returning * into v_cert;

    foreach v_approver in array v_program.approver_ids loop
      insert into public.certificate_approvals (certificate_id, approver_id)
      values (v_cert.id, v_approver)
      on conflict (certificate_id, approver_id) do nothing;
    end loop;

    return next v_cert;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- approve_import / reject_import: replaces storage.approveImport/rejectImport
-- ---------------------------------------------------------------------------
create or replace function public.approve_import(p_batch_id uuid)
returns setof public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch       public.import_batches;
  v_program     public.training_programs;
  v_template    public.certificate_templates;
  v_row         public.pending_import_trainees;
  v_trainee     public.trainees;
  v_trainee_ids uuid[] := '{}';
begin
  select * into v_batch from public.import_batches where id = p_batch_id;
  if not found or v_batch.status <> 'PENDING_APPROVAL' then
    raise exception 'Import is not awaiting approval.';
  end if;

  select * into v_program from public.training_programs where id = v_batch.training_program_id;
  if not found or not (auth.uid() = any (v_program.approver_ids)) then
    raise exception 'Approver is not assigned to this training program.';
  end if;
  if v_program.status <> 'COMPLETED' then
    raise exception 'Certificates can only be issued once the training program is marked COMPLETED.';
  end if;
  if v_batch.template_id is null then
    raise exception 'A certificate template must be selected before generation.';
  end if;

  select * into v_template
    from public.certificate_templates
   where id = v_batch.template_id and status = 'ACTIVE';
  if not found then
    raise exception 'The selected certificate template is no longer available.';
  end if;

  if exists (
    select 1 from public.pending_import_trainees
     where import_batch_id = p_batch_id and validation_status <> 'VALID'
  ) then
    raise exception 'Invalid rows must be corrected before approval.';
  end if;

  for v_row in
    select * from public.pending_import_trainees where import_batch_id = p_batch_id
  loop
    insert into public.trainees (
      training_program_id, recipient_name, email, employee_id,
      department, training_code, dynamic_data
    )
    values (
      v_batch.training_program_id, v_row.recipient_name, v_row.email, v_row.employee_id,
      v_row.department, v_row.training_code, v_row.dynamic_data
    )
    returning * into v_trainee;

    v_trainee_ids := v_trainee_ids || v_trainee.id;
  end loop;

  update public.import_batches
     set status = 'APPROVED', reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_batch_id;

  insert into public.audit_logs (user_id, action, entity_type, entity_id)
  values (auth.uid(), 'Import approved and certificates issued', 'ImportBatch', p_batch_id::text);

  return query
    select * from public.issue_certificates(v_batch.training_program_id, v_trainee_ids, v_template.id);
end;
$$;

create or replace function public.reject_import(p_batch_id uuid, p_reason text)
returns public.import_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch   public.import_batches;
  v_program public.training_programs;
begin
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'A rejection reason is required.';
  end if;

  select * into v_batch from public.import_batches where id = p_batch_id;
  if not found or v_batch.status <> 'PENDING_APPROVAL' then
    raise exception 'Import cannot be rejected in its current state.';
  end if;

  select * into v_program from public.training_programs where id = v_batch.training_program_id;
  if not found or not (auth.uid() = any (v_program.approver_ids)) then
    raise exception 'Import cannot be rejected by this approver.';
  end if;

  update public.import_batches
     set status = 'REJECTED', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = p_reason
   where id = p_batch_id
   returning * into v_batch;

  return v_batch;
end;
$$;

-- ---------------------------------------------------------------------------
-- decide_certificate_approval: replaces the act() logic in src/pages/Approvals.tsx
-- Single-approval model: whoever decides first finalises the certificate.
-- ---------------------------------------------------------------------------
create or replace function public.decide_certificate_approval(
  p_approval_id uuid,
  p_decision    public.approval_status,
  p_reason      text default null
)
returns public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_approval public.certificate_approvals;
  v_profile  public.profiles;
  v_cert     public.certificates;
begin
  if p_decision not in ('APPROVED', 'REJECTED') then
    raise exception 'Decision must be APPROVED or REJECTED.';
  end if;

  select * into v_approval from public.certificate_approvals where id = p_approval_id;
  if not found then
    raise exception 'Approval not found.';
  end if;
  if v_approval.approver_id <> auth.uid() then
    raise exception 'This approval is not assigned to you.';
  end if;
  if v_approval.status <> 'PENDING' then
    raise exception 'This approval has already been decided.';
  end if;
  if p_decision = 'REJECTED' and coalesce(btrim(p_reason), '') = '' then
    raise exception 'A rejection reason is required.';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  update public.certificate_approvals
     set status           = p_decision,
         rejection_reason = case when p_decision = 'REJECTED' then p_reason end,
         approved_at      = case when p_decision = 'APPROVED' then now() end,
         rejected_at      = case when p_decision = 'REJECTED' then now() end
   where id = p_approval_id;

  update public.certificates
     set status = case
                    when p_decision = 'APPROVED' then 'VALID'::public.certificate_status
                    else 'REJECTED'::public.certificate_status
                  end,
         signature_user_id = case when p_decision = 'APPROVED' then v_profile.id else signature_user_id end,
         signer_name       = case when p_decision = 'APPROVED' then v_profile.name else signer_name end,
         signer_title      = case when p_decision = 'APPROVED' then 'Approver' else signer_title end
   where id = v_approval.certificate_id
   returning * into v_cert;

  -- Close sibling approvals so the certificate stops showing in other queues.
  update public.certificate_approvals
     set status = p_decision
   where certificate_id = v_approval.certificate_id
     and id <> p_approval_id
     and status = 'PENDING';

  insert into public.audit_logs (user_id, action, entity_type, entity_id)
  values (auth.uid(), 'Certificate ' || p_decision, 'Certificate', v_cert.id::text);

  return v_cert;
end;
$$;

-- ---------------------------------------------------------------------------
-- verify_certificate: the ONLY thing anonymous users may call.
-- Returns a single row and deliberately omits email so a scanned QR cannot be
-- used to harvest recipient addresses.
-- ---------------------------------------------------------------------------
create or replace function public.verify_certificate(p_token uuid)
returns table (
  id                      uuid,
  certificate_number      text,
  short_id                text,
  verification_token      uuid,
  recipient_name          text,
  certificate_title       text,
  course_name             text,
  issue_date              date,
  organization            text,
  certificate_type        text,
  status                  public.certificate_status,
  certificate_template_id uuid,
  signer_name             text,
  signer_title            text,
  dynamic_data            jsonb,
  created_at              timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.certificate_number, c.short_id, c.verification_token,
         c.recipient_name, c.certificate_title, c.course_name,
         c.issue_date, c.organization, c.certificate_type,
         c.status, c.certificate_template_id,
         c.signer_name, c.signer_title, c.dynamic_data, c.created_at
    from public.certificates c
   where c.verification_token = p_token
   limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Execution grants. SECURITY DEFINER functions bypass RLS, so anonymous users
-- must only ever reach verify_certificate.
-- ---------------------------------------------------------------------------
revoke all on function public.generate_short_id()                                        from public;
revoke all on function public.generate_unique_short_id()                                 from public;
revoke all on function public.next_certificate_number()                                  from public;
revoke all on function public.issue_certificates(uuid, uuid[], uuid)                     from public;
revoke all on function public.approve_import(uuid)                                       from public;
revoke all on function public.reject_import(uuid, text)                                  from public;
revoke all on function public.decide_certificate_approval(uuid, public.approval_status, text) from public;
revoke all on function public.verify_certificate(uuid)                                   from public;

grant execute on function public.issue_certificates(uuid, uuid[], uuid)                     to authenticated;
grant execute on function public.approve_import(uuid)                                       to authenticated;
grant execute on function public.reject_import(uuid, text)                                  to authenticated;
grant execute on function public.decide_certificate_approval(uuid, public.approval_status, text) to authenticated;
grant execute on function public.verify_certificate(uuid)                                   to anon, authenticated;
