"use client";

import { useEffect, useState } from "react";
import { useSupport, FeatureRequest } from "../hooks/useSupport";

export default function SupportFeaturesPage() {
  const { fetchFeatures, createFeature, upvoteFeature, loading, actionLoading } = useSupport();
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const loadFeatures = async () => {
    const data = await fetchFeatures();
    setFeatures(data);
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFeature({ title, description });
      setShowModal(false);
      setTitle("");
      setDescription("");
      loadFeatures();
    } catch (e) {
      alert("Failed to submit feature request");
    }
  };

  const handleUpvote = async (id: number) => {
    try {
      await upvoteFeature(id);
      loadFeatures();
    } catch (e) {
      alert("Failed to upvote");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Feature Requests</h1>
          <p className="text-slate-400 mt-2">Help shape the future of Ravan AI. Suggest features and upvote community ideas.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
        >
          Suggest Feature
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                f.status === 'completed' ? 'bg-green-900/50 text-green-400 border border-green-500/20' :
                f.status === 'active' ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/20' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {f.status}
              </span>
              <button 
                onClick={() => handleUpvote(f.id)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-700"
              >
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                {f.upvotes}
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400 flex-1">{f.description}</p>
            <div className="mt-6 text-xs text-slate-500">
              Suggested on {new Date(f.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}

        {features.length === 0 && !loading && (
          <div className="col-span-3 p-12 text-center text-slate-500 border border-slate-800 border-dashed rounded-xl">
            No feature requests yet. Be the first to suggest one!
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Suggest a Feature</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="E.g., Dark Mode Theme" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-32" placeholder="Why is this feature useful? How should it work?" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button disabled={actionLoading} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
