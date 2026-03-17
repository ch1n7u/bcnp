"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/admin");
  }, [router]);

  return <p className="p-6 text-sm text-slate-600">Redirecting to admin dashboard...</p>;
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <AdminRedirect />
    </ProtectedRoute>
  );
}
