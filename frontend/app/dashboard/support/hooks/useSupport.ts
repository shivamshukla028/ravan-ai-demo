"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";

const BASE = "/api/support";

export interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  upvotes: number;
  created_at: string;
  has_voted?: boolean;
}

export interface UsageReport {
  total_tokens: number;
  total_documents: number;
  storage_bytes: number;
  conversations: number;
}


export function useSupport() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTickets = useCallback(async (): Promise<SupportTicket[]> => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}/tickets`);
      return res.data;
    } catch (err) {
      console.error("Fetch tickets failed", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (data: { subject: string, description: string, priority: string }) => {
    setActionLoading(true);
    try {
      const res = await api.post(`${BASE}/tickets`, data);
      return res.data;
    } catch (err) {
      console.error("Create ticket failed", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const fetchFeatures = useCallback(async (): Promise<FeatureRequest[]> => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}/features`);
      return res.data;
    } catch (err) {
      console.error("Fetch features failed", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createFeature = useCallback(async (data: { title: string, description: string }) => {
    setActionLoading(true);
    try {
      const res = await api.post(`${BASE}/features`, data);
      return res.data;
    } catch (err) {
      console.error("Create feature failed", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const upvoteFeature = useCallback(async (id: number) => {
    try {
      const res = await api.post(`${BASE}/features/${id}/upvote`);
      return res.data;
    } catch (err) {
      console.error("Upvote failed", err);
      throw err;
    }
  }, []);

  const fetchUsage = useCallback(async (): Promise<UsageReport | null> => {
    setLoading(true);
    try {
      const res = await api.get(`${BASE}/usage`);
      return res.data;
    } catch (err) {
      console.error("Fetch usage failed", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);


  return {
    loading,
    actionLoading,
    fetchTickets,
    createTicket,
    fetchFeatures,
    createFeature,
    upvoteFeature,
    fetchUsage,
  };
}
