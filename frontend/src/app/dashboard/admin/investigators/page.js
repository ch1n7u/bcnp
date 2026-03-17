"use client";

import InvestigatorManagement from "../../../../components/InvestigatorManagement";
import ProtectedRoute from "../../../../components/ProtectedRoute";

export default function AdminInvestigatorsPage() {
  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <InvestigatorManagement />
    </ProtectedRoute>
  );
}