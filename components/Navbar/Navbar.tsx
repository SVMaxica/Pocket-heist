"use client";

import { Clock8, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div className={styles.siteNav}>
      <nav>
        <header>
          <h1>
            <Link href="/heists">
              P<Clock8 className={styles.logo} size={14} strokeWidth={2.75} />
              cket Heist
            </Link>
          </h1>
          <div>Tiny missions. Big office mischief.</div>
        </header>
        <ul>
          <li>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
          <li>
            <Link href="/heists/create" className={styles.createHeistBtn}>
              <Plus size={16} strokeWidth={2.75} />
              Create Heist
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
