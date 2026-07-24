"use client";

import HeistCard from "@/components/HeistCard";
import HeistCardSkeleton from "@/components/HeistCardSkeleton";
import { useHeists, type HeistsMode } from "@/lib/useHeists";
import styles from "./HeistCardGrid.module.css";

// Fyller en desktop-rad (tre kolumner) med platshållare under laddning.
const SKELETON_COUNT = 3;

interface HeistCardGridProps {
  mode: Extract<HeistsMode, "active" | "assigned">;
}

export default function HeistCardGrid({ mode }: HeistCardGridProps) {
  const { status, heists } = useHeists(mode);

  if (status === "loading") {
    return (
      <div className={styles.grid}>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <HeistCardSkeleton key={index} />
        ))}
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
    <div className={styles.grid}>
      {heists.map((heist) => (
        <HeistCard key={heist.id} heist={heist} />
      ))}
    </div>
  );
}
