import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { RoommateProfile } from "@/data/module1";
import { supabase } from "@/integrations/supabase/client";

export type SavedSessionResult = {
  candidateId: string;
  candidateName: string;
  detail: string;
  total: number;
  hardBlocked: boolean;
  parts: { label: string; weight: number; value: number }[];
};

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, account_type")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { display_name?: string; account_type?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

export function useSavedListings(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-listings", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_listings")
        .select("id, listing_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleSavedListing(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, saved }: { listingId: string; saved: boolean }) => {
      if (saved) {
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", userId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_listings")
          .insert({ listing_id: listingId, user_id: userId! });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-listings", userId] }),
  });
}

export function useApplications(userId: string | undefined) {
  return useQuery({
    queryKey: ["applications", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, listing_id, note, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useApply(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, note }: { listingId: string; note: string }) => {
      const { error } = await supabase
        .from("applications")
        .upsert(
          { user_id: userId!, listing_id: listingId, note, status: "submitted" },
          { onConflict: "user_id,listing_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications", userId] }),
  });
}

export function useRoommatePreferences(userId: string | undefined) {
  return useQuery({
    queryKey: ["roommate-preferences", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roommate_preferences")
        .select("budget, sleep, smoking, smoking_non_negotiable, study, visitors")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveRoommatePreferences(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: RoommateProfile) => {
      const { error } = await supabase.from("roommate_preferences").upsert(
        {
          user_id: userId!,
          budget: profile.budget,
          sleep: profile.sleep,
          smoking: profile.smoking,
          smoking_non_negotiable: profile.smokingNonNegotiable,
          study: profile.study,
          visitors: profile.visitors,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roommate-preferences", userId] }),
  });
}

export function useRoommateSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ["roommate-sessions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roommate_sessions")
        .select("id, label, profile, results, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveRoommateSession(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      label: string;
      profile: RoommateProfile;
      results: SavedSessionResult[];
    }) => {
      const { error } = await supabase.from("roommate_sessions").insert({
        user_id: userId!,
        label: input.label,
        profile: input.profile,
        results: input.results,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roommate-sessions", userId] }),
  });
}

export function useDeleteRoommateSession(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roommate_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roommate-sessions", userId] }),
  });
}
