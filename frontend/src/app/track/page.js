"use client";

import CaseTracker from "../../components/CaseTracker";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function TrackPage() {
  return (
    <ProtectedRoute allowRoles={["citizen", "investigator", "admin"]}>
      <CaseTracker />
    </ProtectedRoute>
  );
}
