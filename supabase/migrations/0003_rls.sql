-- 0003_rls.sql
-- Run after 0002_functions.sql. Until this runs, RLS denies everything.
--
-- Anonymous users get NO direct table access to certificates. The public verify
-- page reaches exactly one row through verify_certificate(), because a policy
-- permissive enough to serve that page directly would publish every certificate,
-- recipient name and email address on the internet.

-- ---------------------------------------------------------------------------
-- profiles
-- Readable by any signed-in user: approver and trainer pickers need names.
-- ---------------------------------------------------------------------------
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (true);

create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_delete_admin on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- Rows are created by the on_auth_user_created trigger, which is SECURITY
-- DEFINER and bypasses RLS. No INSERT policy is granted on purpose.

-- ---------------------------------------------------------------------------
-- certificate_templates
-- anon SELECT is required: the public verify page renders the certificate,
-- which needs its template layout. Templates carry no personal data.
-- ---------------------------------------------------------------------------
create policy certificate_templates_select_all on public.certificate_templates
  for select to anon, authenticated
  using (true);

create policy certificate_templates_write_admin on public.certificate_templates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- training_programs
-- ---------------------------------------------------------------------------
create policy training_programs_select_authenticated on public.training_programs
  for select to authenticated
  using (true);

create policy training_programs_insert_admin on public.training_programs
  for insert to authenticated
  with check (public.is_admin());

-- Admins edit anything; assigned trainers may update their own program
-- (this is what backs approveTraining moving DRAFT -> COMPLETED).
create policy training_programs_update_admin_or_trainer on public.training_programs
  for update to authenticated
  using (public.is_admin() or auth.uid() = any (trainer_ids))
  with check (public.is_admin() or auth.uid() = any (trainer_ids));

create policy training_programs_delete_admin on public.training_programs
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- trainees
-- Inserts normally happen inside approve_import(), which is SECURITY DEFINER.
-- ---------------------------------------------------------------------------
create policy trainees_select_authenticated on public.trainees
  for select to authenticated
  using (true);

create policy trainees_write_admin on public.trainees
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- import_batches
-- Visible to the uploader, to approvers on the program, and to admins.
-- ---------------------------------------------------------------------------
create policy import_batches_select_involved on public.import_batches
  for select to authenticated
  using (
    public.is_admin()
    or uploaded_by = auth.uid()
    or exists (
      select 1 from public.training_programs p
       where p.id = import_batches.training_program_id
         and (auth.uid() = any (p.approver_ids) or auth.uid() = any (p.trainer_ids))
    )
  );

create policy import_batches_insert_own on public.import_batches
  for insert to authenticated
  with check (uploaded_by = auth.uid());

-- The uploader may still edit a batch that has not been decided. Approve and
-- reject go through the RPCs, which bypass this policy.
create policy import_batches_update_uploader on public.import_batches
  for update to authenticated
  using (public.is_admin() or (uploaded_by = auth.uid() and status in ('DRAFT', 'PENDING_APPROVAL')))
  with check (public.is_admin() or uploaded_by = auth.uid());

create policy import_batches_delete_uploader on public.import_batches
  for delete to authenticated
  using (public.is_admin() or (uploaded_by = auth.uid() and status = 'DRAFT'));

-- ---------------------------------------------------------------------------
-- pending_import_trainees: inherits visibility from its batch
-- ---------------------------------------------------------------------------
create policy pending_rows_select_via_batch on public.pending_import_trainees
  for select to authenticated
  using (
    exists (
      select 1 from public.import_batches b
       where b.id = pending_import_trainees.import_batch_id
         and (
           public.is_admin()
           or b.uploaded_by = auth.uid()
           or exists (
             select 1 from public.training_programs p
              where p.id = b.training_program_id
                and (auth.uid() = any (p.approver_ids) or auth.uid() = any (p.trainer_ids))
           )
         )
    )
  );

create policy pending_rows_insert_via_batch on public.pending_import_trainees
  for insert to authenticated
  with check (
    exists (
      select 1 from public.import_batches b
       where b.id = pending_import_trainees.import_batch_id
         and b.uploaded_by = auth.uid()
    )
  );

create policy pending_rows_delete_via_batch on public.pending_import_trainees
  for delete to authenticated
  using (
    exists (
      select 1 from public.import_batches b
       where b.id = pending_import_trainees.import_batch_id
         and (public.is_admin() or b.uploaded_by = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- certificates
-- No INSERT policy at all: certificates may only come from issue_certificates().
-- No anon policy: the public verify page uses verify_certificate() instead.
-- ---------------------------------------------------------------------------
create policy certificates_select_authenticated on public.certificates
  for select to authenticated
  using (true);

-- Admins revoke. Approval decisions go through decide_certificate_approval().
create policy certificates_update_admin on public.certificates
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy certificates_delete_admin on public.certificates
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- certificate_approvals
-- Writes go through decide_certificate_approval() only.
-- ---------------------------------------------------------------------------
create policy certificate_approvals_select_authenticated on public.certificate_approvals
  for select to authenticated
  using (true);

create policy certificate_approvals_delete_admin on public.certificate_approvals
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs: anyone signed in may append; only admins may read the history.
-- ---------------------------------------------------------------------------
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using (public.is_admin());

create policy audit_logs_insert_authenticated on public.audit_logs
  for insert to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- certificate_counters: no policies. Reachable only through
-- next_certificate_number(), which is SECURITY DEFINER.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Storage: template-assets bucket (create it in the dashboard as public first)
-- ---------------------------------------------------------------------------
create policy template_assets_read_all on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'template-assets');

create policy template_assets_insert_authenticated on storage.objects
  for insert to authenticated
  with check (bucket_id = 'template-assets');

create policy template_assets_update_authenticated on storage.objects
  for update to authenticated
  using (bucket_id = 'template-assets')
  with check (bucket_id = 'template-assets');

create policy template_assets_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'template-assets' and public.is_admin());
