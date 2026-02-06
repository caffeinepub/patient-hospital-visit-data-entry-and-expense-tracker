import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, VisitEntry } from '../backend';

// User Profile Queries
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

// Visit Entry Queries
export function useGetUserVisitEntries() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VisitEntry[]>({
    queryKey: ['visitEntries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserVisitEntries();
    },
    enabled: !!actor && !actorFetching,
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
      return actor.createVisitEntry(
        params.hospitalName,
        params.visitDate,
        params.doctorName,
        params.patientName,
        params.hospitalRs,
        params.medicineRs,
        params.medicineName,
        params.address
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitEntries'] });
    },
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
      return actor.editVisitEntry(
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
