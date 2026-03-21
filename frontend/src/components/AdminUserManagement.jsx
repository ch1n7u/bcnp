"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../lib/api";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const confirmDelete = async () => {
    if (!pendingDeleteUser) return;
    try {
      setDeletingId(pendingDeleteUser.id);
      setError("");
      await api.delete(`/admin/users/${pendingDeleteUser.id}`);
      await loadUsers();
      setPendingDeleteUser(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Registered Users</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review all registered citizens and delete accounts completely.
          </p>
        </div>
        <div>
          <Link href="/dashboard/admin" className="rounded-lg border px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Back to Admin Home
          </Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="glass rounded-2xl p-5 sm:p-6">
        {loading ? (
          <p className="text-sm text-slate-600">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Joined</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t align-middle hover:bg-white/40 transition-colors">
                    <td className="p-2 font-medium">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-2">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-2">
                      <button
                        className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={user.role === 'admin' || deletingId === user.id}
                        onClick={() => setPendingDeleteUser(user)}
                      >
                        {user.role === 'admin' ? "Protected" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isMounted && pendingDeleteUser && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-2xl sm:p-6">
            <h3 className="font-display text-xl font-bold text-slate-900">Delete {pendingDeleteUser.name}?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently delete the user account ({pendingDeleteUser.email}). Any cases associated with this user might become orphaned. This action cannot be undone.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => setPendingDeleteUser(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
