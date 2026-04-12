"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (allowRoles.length > 0 && !allowRoles.includes(user?.role)) {
      router.replace("/unauthorized");
    }
  }, [allowRoles, isAuthenticated, loading, pathname, router, user?.role]);

  if (loading || !isAuthenticated) {
    return <p className="p-6 text-sm text-slate-600">Checking authorization...</p>;
  }

  if (allowRoles.length > 0 && !allowRoles.includes(user?.role)) {
    return null;
  }

  return children;
}
