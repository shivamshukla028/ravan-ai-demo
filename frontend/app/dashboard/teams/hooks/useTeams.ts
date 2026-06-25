"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

const BASE = "/api/teams";

export interface TeamMember {
  id: number;
  user_id: number;
  team_id: number;
  role: "owner" | "admin" | "analyst" | "viewer";
  user_email: string;
  user_name: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
  members: TeamMember[];
}

export interface TeamActivityLog {
  id: number;
  team_id: number;
  user_id: number;
  user_name: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface TeamDashboard {
  total_members: number;
  total_documents: number;
  total_conversations: number;
  storage_used_bytes: number;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}`);
      setTeams(res.data || []);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (name: string, description?: string) => {
    try {
      const res = await api.post(`${BASE}`, { name, description });
      setTeams((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      console.error("Failed to create team:", err);
      throw err;
    }
  }, []);

  const inviteMember = useCallback(async (teamId: number, email: string, role: string) => {
    try {
      const res = await api.post(`${BASE}/${teamId}/members`, { email, role });
      return res.data;
    } catch (err) {
      console.error("Failed to invite member:", err);
      throw err;
    }
  }, []);

  const updateMemberRole = useCallback(async (teamId: number, userId: number, role: string) => {
    try {
      await api.patch(`${BASE}/${teamId}/members/${userId}`, { role });
    } catch (err) {
      console.error("Failed to update role:", err);
      throw err;
    }
  }, []);

  const fetchDashboard = useCallback(async (teamId: number) => {
    try {
      const res = await api.get(`${BASE}/${teamId}/dashboard`);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      return null;
    }
  }, []);

  const fetchActivity = useCallback(async (teamId: number) => {
    try {
      const res = await api.get(`${BASE}/${teamId}/activity`);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      return [];
    }
  }, []);

  return {
    teams,
    loading,
    fetchTeams,
    createTeam,
    inviteMember,
    updateMemberRole,
    fetchDashboard,
    fetchActivity,
  };
}
