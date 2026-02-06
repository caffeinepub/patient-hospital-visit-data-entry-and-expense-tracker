import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, VisitEntry } from '../backend';
import { formatErrorMessage } from '../utils/errorMessages';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useCreateVisitEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      hospitalName: string;
      visitDate: bigint;
      doctorName: string;
      patientName: string;
      hospitalRs: bigint;
      medicineRs: bigint;
      medicineName: string;
      address: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.createVisitEntry(
          params.hospitalName,
          params.visitDate,
          params.doctorName,
          params.patientName,
          params.hospitalRs,
          params.medicineRs,
          params.medicineName,
          params.address
        );
      } catch (error) {
        throw new Error(formatErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitEntries'] });
    },
  });
}

export function useGetUserVisitEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<VisitEntry[]>({
    queryKey: ['visitEntries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserVisitEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEditVisitEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      hospitalName: string;
      visitDate: bigint;
      doctorName: string;
      patientName: string;
      hospitalRs: bigint;
      medicineRs: bigint;
      medicineName: string;
      address: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.editVisitEntry(
          params.id,
          params.hospitalName,
          params.visitDate,
          params.doctorName,
          params.patientName,
          params.hospitalRs,
          params.medicineRs,
          params.medicineName,
          params.address
        );
      } catch (error) {
        throw new Error(formatErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitEntries'] });
    },
  });
}

export function useDeleteVisitEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; originalHospitalName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVisitEntry(params.id, params.originalHospitalName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitEntries'] });
    },
  });
}
