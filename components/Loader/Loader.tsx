import { LoaderCircle } from "lucide-react";
import styles from "./Loader.module.css";

export default function Loader() {
  return (
    <div className={styles.loader} role="status" aria-label="Loading">
      <LoaderCircle className={styles.spinner} />
    </div>
  );
}
