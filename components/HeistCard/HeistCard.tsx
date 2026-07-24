import { Calendar, Clock8, User } from "lucide-react";
import Link from "next/link";
import { getHeistTimeStatus } from "@/lib/heistTimeStatus";
import { type Heist } from "@/types/firestore";
import styles from "./HeistCard.module.css";

interface HeistCardProps {
  heist: Heist;
}

export default function HeistCard({ heist }: HeistCardProps) {
  const deadlineDate = heist.deadline.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const { label: timeStatus, isOverdue } = getHeistTimeStatus(heist.deadline);
  const resultBadge = isOverdue
    ? heist.finalStatus === "success"
      ? { label: "Success", className: styles.resultBadgeSuccess }
      : { label: "Expired", className: styles.resultBadgeExpired }
    : null;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <Link href={`/heists/${heist.id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{heist.title}</h3>
        </Link>
        <div className={styles.statusGroup}>
          {resultBadge && (
            <span className={`${styles.resultBadge} ${resultBadge.className}`}>
              <span className="sr-only">Result: </span>
              {resultBadge.label}
            </span>
          )}
          <Clock8
            className={`${styles.statusIcon} ${isOverdue ? styles.statusIconOverdue : ""}`}
            size={16}
            strokeWidth={2.75}
            aria-hidden="true"
          />
        </div>
      </div>

      <p className={styles.metaRow}>
        <User size={14} strokeWidth={2.75} aria-hidden="true" />
        To:{" "}
        <span className={styles.assigneeCodename}>
          {heist.assignedToCodename || "Unassigned"}
        </span>
      </p>
      <p className={styles.metaRow}>
        <User size={14} strokeWidth={2.75} aria-hidden="true" />
        By:{" "}
        <span className={styles.creatorCodename}>
          {heist.createdByCodename || "Unknown"}
        </span>
      </p>

      <p className={styles.dateRow}>
        <Calendar size={14} strokeWidth={2.75} aria-hidden="true" />
        {deadlineDate}
        <span aria-hidden="true">•</span>
        <span
          className={`${styles.timeStatus} ${isOverdue ? styles.timeStatusOverdue : ""}`}
        >
          {timeStatus}
        </span>
      </p>
    </article>
  );
}
