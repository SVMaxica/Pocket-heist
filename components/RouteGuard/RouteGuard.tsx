"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/useAuthState";
import Loader from "@/components/Loader";
import styles from "./RouteGuard.module.css";

export type RouteGuardMode =
  "require-authenticated" | "require-unauthenticated";

interface RouteGuardProps {
  mode: RouteGuardMode;
  redirectTo: string;
  children: React.ReactNode;
}

export default function RouteGuard({
  mode,
  redirectTo,
  children,
}: RouteGuardProps) {
  const { status } = useAuthState();
  const router = useRouter();

  const shouldRedirect =
    (mode === "require-authenticated" && status === "unauthenticated") ||
    (mode === "require-unauthenticated" && status === "authenticated");

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(redirectTo);
    }
  }, [shouldRedirect, redirectTo, router]);

  if (status === "error") {
    return (
      <div className={styles.errorWrap}>
        <p role="alert" className={styles.error}>
          Something went wrong checking your session. Please refresh the page.
        </p>
      </div>
    );
  }

  // Rendera aldrig children under laddning eller när en omdirigering ska ske —
  // Loader visas redan i render-grenen (inte bara i effekten) så fel innehåll
  // aldrig hamnar i trädet, inte ens för en enda paint.
  if (status === "loading" || shouldRedirect) {
    return <Loader />;
  }

  return <>{children}</>;
}
