"use client";

import { useEffect, useState } from "react";
import { useSupport, SupportTicket } from "../hooks/useSupport";

export default function SupportTicketsPage() {
  const { fetchTickets, createTicket, loading, actionLoading } = useSupport();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");

  const loadTickets = async () => {
    const data = await fetchTickets();
    setTickets(data);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTicket({ subject, description, priority });
      setShowModal(false);
      setSubject("");
      setDescription("");
      setPriority("normal");
      loadTickets();
    } catch (e) {
      alert("Failed to submit ticket");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400 mt-2">Track your active requests and contact our technical team.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
        >
          New Ticket
        </button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Subject</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-200">{t.subject}</div>
                  <div className="text-xs text-slate-500 truncate max-w-xs">{t.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                    t.status === 'open' ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/20' :
                    t.status === 'in_progress' ? 'bg-orange-900/50 text-orange-400 border border-orange-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold uppercase ${
                    t.priority === 'urgent' ? 'text-red-400' :
                    t.priority === 'high' ? 'text-orange-400' :
                    t.priority === 'low' ? 'text-slate-500' :
                    'text-slate-300'
                  }`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(t.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  You have no support tickets.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create Support Ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Subject</label>
                <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Brief summary of issue..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-32" placeholder="Detailed explanation..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button disabled={actionLoading} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
