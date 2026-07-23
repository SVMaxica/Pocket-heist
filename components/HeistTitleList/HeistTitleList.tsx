"use client";

import { Clock8 } from "lucide-react";
import { useHeists, type HeistsMode } from "@/lib/useHeists";
import styles from "./HeistTitleList.module.css";

interface HeistTitleListProps {
  mode: HeistsMode;
}

export default function HeistTitleList({ mode }: HeistTitleListProps) {
  const { status, heists } = useHeists(mode);

  if (status === "loading") {
    return (
      <div className={styles.loader} role="status" aria-label="Loading heists">
        <Clock8 className={styles.spinner} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <p role="alert" className={styles.error}>
        Could not load heists. Please try again.
      </p>
    );
  }

  if (heists.length === 0) {
    return <p className={styles.hint}>No heists here yet.</p>;
  }

  return (
    <ul className={styles.list}>
      {heists.map((heist) => (
        <li key={heist.id}>{heist.title}</li>
      ))}
    </ul>
  );
}
