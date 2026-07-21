"use client";

import { useAuth, useClerk } from "@clerk/nextjs";

export function useRequireAuth() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  return () => {
    if (!isSignedIn) {
      openSignIn();
      return false;
    }

    return true;
  };
}