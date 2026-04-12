"use client";

import AdminUserManagement from "../../../../components/AdminUserManagement";
import ProtectedRoute from "../../../../components/ProtectedRoute";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <AdminUserManagement />
    </ProtectedRoute>
  );
}
