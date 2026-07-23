"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function useRequireAuth() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();

  return () => {
    if (!isSignedIn) {
      openSignIn();
      return false;
    }

    router.push("/playground");
    return true;
  };
}