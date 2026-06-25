"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

const BASE = "/api/ops";

export interface SystemHealth {
  status: string;
  uptime_seconds: number;
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  database: string;
}

export function useOps() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHealth = useCallback(async (): Promise<SystemHealth | null> => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}/health`);
      return res.data;
    } catch (err) {
      console.error("Fetch health failed", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerBackup = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`${BASE}/backups/trigger`);
      return res.data;
    } catch (err) {
      console.error("Trigger backup failed", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const testAlert = useCallback(async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`${BASE}/alerts/test`);
      return res.data;
    } catch (err) {
      console.error("Test alert failed", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    loading,
    actionLoading,
    fetchHealth,
    triggerBackup,
    testAlert
  };
}
