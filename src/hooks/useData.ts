import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/db';
import { Certificate, CertificateTemplate, TrainingProgram } from '../types';

export const keys = {
  users: ['users'] as const,
  templates: ['templates'] as const,
  trainings: ['trainings'] as const,
  training: (id: string) => ['trainings', id] as const,
  trainees: (programId: string) => ['trainees', programId] as const,
  certificates: ['certificates'] as const,
  certificate: (id: string) => ['certificates', id] as const,
  approvals: ['approvals'] as const,
  batches: ['import-batches'] as const,
  batch: (id: string) => ['import-batches', id] as const,
  pendingRows: (batchId: string) => ['pending-rows', batchId] as const,
};

export const useUsers = () => useQuery({ queryKey: keys.users, queryFn: db.getUsers });

export const useTemplates = () => useQuery({ queryKey: keys.templates, queryFn: db.getTemplates });

export const useTrainings = () => useQuery({ queryKey: keys.trainings, queryFn: db.getTrainings });

export const useTraining = (id?: string) =>
  useQuery({
    queryKey: keys.training(id ?? ''),
    queryFn: () => db.getTraining(id as string),
    enabled: Boolean(id),
  });

export const useTrainees = (programId?: string) =>
  useQuery({
    queryKey: keys.trainees(programId ?? ''),
    queryFn: () => db.getTraineesForTraining(programId as string),
    enabled: Boolean(programId),
  });

export const useCertificates = () => useQuery({ queryKey: keys.certificates, queryFn: db.getCertificates });

export const useCertificate = (id?: string) =>
  useQuery({
    queryKey: keys.certificate(id ?? ''),
    queryFn: () => db.getCertificateById(id as string),
    enabled: Boolean(id),
  });

export const useApprovals = () => useQuery({ queryKey: keys.approvals, queryFn: db.getApprovals });

export const useImportBatches = () => useQuery({ queryKey: keys.batches, queryFn: db.getImportBatches });

export const useImportBatch = (id?: string) =>
  useQuery({
    queryKey: keys.batch(id ?? ''),
    queryFn: () => db.getImportBatch(id as string),
    enabled: Boolean(id),
  });

export const usePendingImportTrainees = (batchId?: string) =>
  useQuery({
    queryKey: keys.pendingRows(batchId ?? ''),
    queryFn: () => db.getPendingImportTrainees(batchId as string),
    enabled: Boolean(batchId),
  });

// --------------------------------------------------------------------------
// Mutations
// --------------------------------------------------------------------------

export function useSaveTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (template: CertificateTemplate) =>
      template.id ? db.updateTemplate(template) : db.saveTemplate(template),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.templates }),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.templates }),
  });
}

export function useSaveTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (training: TrainingProgram | Omit<TrainingProgram, 'id' | 'createdAt'>) =>
      'id' in training && training.id
        ? db.updateTraining(training as TrainingProgram)
        : db.saveTraining(training),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.trainings }),
  });
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.updateCertificateStatus(id, 'REVOKED'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.certificates }),
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      approvalId,
      decision,
      reason,
    }: {
      approvalId: string;
      decision: 'APPROVED' | 'REJECTED';
      reason?: string;
    }): Promise<Certificate> => db.decideCertificateApproval(approvalId, decision, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.approvals });
      queryClient.invalidateQueries({ queryKey: keys.certificates });
    },
  });
}

export function useApproveImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => db.approveImport(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.batches });
      queryClient.invalidateQueries({ queryKey: keys.certificates });
      queryClient.invalidateQueries({ queryKey: keys.approvals });
    },
  });
}

export function useRejectImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, reason }: { batchId: string; reason: string }) =>
      db.rejectImport(batchId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.batches }),
  });
}
