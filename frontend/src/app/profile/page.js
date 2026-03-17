"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import ProfileSummary from "../../components/ProfileSummary";

export default function ProfilePage() {
  return (
    <ProtectedRoute allowRoles={["citizen", "investigator"]}>
      <ProfileSummary />
    </ProtectedRoute>
  );
}
