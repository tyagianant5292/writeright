"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import LoginModal from "./LoginModal";

export default function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return <div className="h-9 w-20 animate-pulse rounded-full bg-border" />;
  }

  return (
    <>
      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline" title={user.email}>
            {user.email}
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/15 text-sm font-bold text-brand">
            {user.email.charAt(0).toUpperCase()}
          </span>
          <button
            onClick={logout}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            Log out
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowLogin(true)}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Sign in
        </button>
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
