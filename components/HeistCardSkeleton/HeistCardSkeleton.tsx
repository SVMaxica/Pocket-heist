import styles from "./HeistCardSkeleton.module.css";

export default function HeistCardSkeleton() {
  return (
    <div className={styles.card} role="status" aria-label="Loading heist">
      <div className={styles.header}>
        <div className={`${styles.line} ${styles.titleLine}`} />
        <div className={styles.iconPlaceholder} />
      </div>
      <div className={`${styles.line} ${styles.metaLine}`} />
      <div className={`${styles.line} ${styles.metaLine}`} />
      <div className={`${styles.line} ${styles.dateLine}`} />
    </div>
  );
}
