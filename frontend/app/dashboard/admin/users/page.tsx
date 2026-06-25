"use client";

import { useEffect, useState } from "react";
import { useAdmin, UserAdmin } from "../hooks/useAdmin";

export default function AdminUsersPage() {
  const { fetchUsers, updateUser, deleteUser, loading } = useAdmin();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    const data = await fetchUsers(search);
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUser(userId, { role: newRole });
      loadUsers();
    } catch (e) {
      alert("Failed to update role. You might not have permission.");
    }
  };

  const handleToggleStatus = async (user: UserAdmin) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      loadUsers();
    } catch (e) {
      alert("Failed to update user status.");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await deleteUser(userId);
      loadUsers();
    } catch (e) {
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-2">Manage accounts, roles, and platform access.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none w-64"
          />
          <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm transition-colors border border-slate-700">
            Search
          </button>
        </form>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Plan</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Joined</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-200">{u.full_name || "Unknown"}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded py-1 px-2 text-xs text-white focus:outline-none cursor-pointer"
                    disabled={u.role === 'owner'}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="owner" disabled>Owner</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                    u.plan === 'enterprise' ? 'bg-purple-900/50 text-purple-400 border border-purple-500/20' :
                    u.plan === 'pro' ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {u.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-red-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Suspended
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={u.role === 'owner'}
                      className={`text-xs hover:underline disabled:opacity-30 disabled:cursor-not-allowed ${u.is_active ? 'text-orange-400' : 'text-green-400'}`}
                    >
                      {u.is_active ? "Suspend" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={u.role === 'owner'}
                      className="text-xs text-red-500 hover:text-red-400 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
