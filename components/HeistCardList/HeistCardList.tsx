"use client";

import HeistCard from "@/components/HeistCard";
import HeistCardSkeleton from "@/components/HeistCardSkeleton";
import { useHeists } from "@/lib/useHeists";
import styles from "./HeistCardList.module.css";

// Ingen grid-rad att fylla i den här enkolumns-listan; 3 skeletons ger bara en
// rimlig känsla av "flera kort på väg" utan att gissa det faktiska antalet.
const SKELETON_COUNT = 3;

export default function HeistCardList() {
  const { status, heists } = useHeists("expired");

  if (status === "loading") {
    return (
      <div className={styles.list}>
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
    return (
      <p role="status" className={styles.hint}>
        No expired heists yet — your streak of flawless mischief continues.
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {heists.map((heist) => (
        <li key={heist.id}>
          <HeistCard heist={heist} />
        </li>
      ))}
    </ul>
  );
}
