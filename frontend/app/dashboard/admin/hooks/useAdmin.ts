"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

const BASE = "/api/admin";

export interface AdminDashboardData {
  total_users: number;
  active_users: number;
  total_revenue_paise: number;
  total_tokens_used: number;
  total_conversations: number;
  system_health: string;
}

export interface UserAdmin {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  plan: string;
}

export interface AdminSubscription {
  id: number;
  user_id: number;
  user_email: string;
  plan: string;
  status: string;
  current_period_end?: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  ip_address?: string;
  details?: string;
  created_at: string;
}

export function useAdmin() {
  const [loading, setLoading] = useState(false);

  const fetchDashboard = useCallback(async (): Promise<AdminDashboardData | null> => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}/dashboard`);
      return res.data;
    } catch (err) {
      console.error("Fetch dashboard failed", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (search?: string): Promise<UserAdmin[]> => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await api.get(`${BASE}/users${q}`);
      return res.data;
    } catch (err) {
      console.error("Fetch users failed", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: number, data: { role?: string; is_active?: boolean }) => {
    try {
      const res = await api.patch(`${BASE}/users/${userId}`, data);
      return res.data;
    } catch (err) {
      console.error("Update user failed", err);
      throw err;
    }
  }, []);

  const deleteUser = useCallback(async (userId: number) => {
    try {
      await api.delete(`${BASE}/users/${userId}`);
    } catch (err) {
      console.error("Delete user failed", err);
      throw err;
    }
  }, []);

  const fetchSubscriptions = useCallback(async (): Promise<AdminSubscription[]> => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}/subscriptions`);
      return res.data;
    } catch (err) {
      console.error("Fetch subs failed", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (): Promise<AdminAuditLog[]> => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}/logs`);
      return res.data;
    } catch (err) {
      console.error("Fetch logs failed", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    fetchDashboard,
    fetchUsers,
    updateUser,
    deleteUser,
    fetchSubscriptions,
    fetchLogs,
  };
}
