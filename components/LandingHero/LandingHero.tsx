import { Clock8, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./LandingHero.module.css";

export default function LandingHero() {
  return (
    <div className="center-content">
      <div className={`page-content ${styles.hero}`}>
        <p className={styles.wordmark}>
          <Clock8
            className={styles.wordmarkIcon}
            size={14}
            strokeWidth={2.75}
          />
          Pocket Heist
        </p>

        <div className={styles.layout}>
          <div className={styles.brief}>
            <p className={styles.eyebrow}>Case file · Status: Open</p>

            <h1 className={styles.headline}>
              Your coworkers <em>won&apos;t</em> see it coming.
            </h1>

            <p className={styles.body}>
              Assign secret little &quot;heists&quot; to your team — swap
              someone&apos;s mouse settings, leave a sticky-note trail, or sneak
              a plant onto their desk. They&apos;ve got 48 hours before the case
              closes.
            </p>

            <div className={styles.actions}>
              <Link href="/signup" className={styles.cta}>
                Join the crew
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link href="/login" className={styles.secondaryLink}>
                Already got a cover? Log in
              </Link>
            </div>
          </div>

          <div className={styles.stamp} aria-hidden="true">
            <span>Classified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
