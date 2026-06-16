"use client";

import { createContext, useContext } from "react";

// Whether the current viewer is a signed-in admin. The value is resolved
// server-side in the root layout (via the admin session cookie) and passed in,
// so there's no client fetch and no flash of admin controls.
const AdminContext = createContext(false);

export function AdminProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>
  );
}

/** True when the viewer is a signed-in admin. Safe to call anywhere client-side. */
export function useAdmin(): boolean {
  return useContext(AdminContext);
}
