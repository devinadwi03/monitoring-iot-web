import React from "react";
import { Navigate } from "react-router-dom";

export default function AuthGuard({ user, role, children }) {
  // kalau belum login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // kalau butuh role tertentu
  if (role && user.role !== role) {
    return <Navigate to="/" replace />; // lempar balik ke dashboard biasa
  }

  // kalau lolos
  return children;
}
