"use client";

import AdminCaseAssignment from "../../../../components/AdminCaseAssignment";
import ProtectedRoute from "../../../../components/ProtectedRoute";

export default function AdminCasesPage() {
  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <AdminCaseAssignment />
    </ProtectedRoute>
  );
}