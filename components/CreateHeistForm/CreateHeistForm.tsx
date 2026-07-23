"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "@/lib/useAuthState";
import {
  buildCreateHeistInput,
  COLLECTIONS,
  userConverter,
  type User,
} from "@/types/firestore";
import Loader from "@/components/Loader";
import styles from "./CreateHeistForm.module.css";

interface FormErrors {
  title?: string;
  description?: string;
  assignedTo?: string;
  form?: string;
}

export default function CreateHeistForm() {
  const router = useRouter();
  const { user } = useAuthState();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [users, setUsers] = useState<User[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getDocs(collection(db, COLLECTIONS.USERS).withConverter(userConverter))
      .then((snapshot) => {
        if (cancelled) return;
        setUsers(snapshot.docs.map((doc) => doc.data()));
      })
      .catch(() => {
        if (cancelled) return;
        setUsersError(
          "Could not load coworkers to assign this heist to. Please try again.",
        );
        setUsers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const assignableUsers = user
    ? (users ?? []).filter((candidate) => candidate.id !== user.uid)
    : [];
  const myCodename = user
    ? users?.find((candidate) => candidate.id === user.uid)?.codename
    : undefined;

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescription(event.target.value);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  }

  function handleAssignedToChange(event: ChangeEvent<HTMLSelectElement>) {
    setAssignedTo(event.target.value);
    if (errors.assignedTo) {
      setErrors((prev) => ({ ...prev, assignedTo: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (title.trim() === "") {
      nextErrors.title = "Title is required";
    }
    if (description.trim() === "") {
      nextErrors.description = "Description is required";
    }
    if (assignedTo === "") {
      nextErrors.assignedTo = "Choose who to assign this heist to";
    }

    if (nextErrors.title || nextErrors.description || nextErrors.assignedTo) {
      setErrors(nextErrors);
      return;
    }

    if (!user || !myCodename) {
      setErrors({
        form: "Could not load your profile. Please refresh and try again.",
      });
      return;
    }

    const assignee = assignableUsers.find(
      (candidate) => candidate.id === assignedTo,
    );
    if (!assignee) {
      setErrors({ form: "Choose a valid coworker to assign this heist to." });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const input = buildCreateHeistInput({
        title: title.trim(),
        description: description.trim(),
        createdBy: user.uid,
        createdByCodename: myCodename,
        assignedTo: assignee.id,
        assignedToCodename: assignee.codename,
      });
      await addDoc(collection(db, COLLECTIONS.HEISTS), input);
      router.push("/heists");
    } catch {
      setErrors({ form: "Could not create the heist. Please try again." });
      setIsSubmitting(false);
    }
  }

  if (users === null) {
    return <Loader />;
  }

  const canSubmit = !usersError && assignableUsers.length > 0;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="heist-title">Title</label>
        <input
          id="heist-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "heist-title-error" : undefined}
        />
        {errors.title && (
          <p id="heist-title-error" className={styles.error}>
            {errors.title}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="heist-description">Description</label>
        <textarea
          id="heist-description"
          value={description}
          onChange={handleDescriptionChange}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? "heist-description-error" : undefined
          }
        />
        {errors.description && (
          <p id="heist-description-error" className={styles.error}>
            {errors.description}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="heist-assignee">Assign to</label>
        {usersError ? (
          <p className={styles.error}>{usersError}</p>
        ) : assignableUsers.length === 0 ? (
          <p className={styles.hint}>
            There&apos;s no one else to assign a heist to yet — invite a
            coworker to sign up first.
          </p>
        ) : (
          <select
            id="heist-assignee"
            value={assignedTo}
            onChange={handleAssignedToChange}
            aria-invalid={errors.assignedTo ? true : undefined}
            aria-describedby={
              errors.assignedTo ? "heist-assignee-error" : undefined
            }
          >
            <option value="" disabled>
              Choose a coworker…
            </option>
            {assignableUsers.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.codename}
              </option>
            ))}
          </select>
        )}
        {errors.assignedTo && (
          <p id="heist-assignee-error" className={styles.error}>
            {errors.assignedTo}
          </p>
        )}
      </div>

      {errors.form && (
        <p role="alert" className={styles.error}>
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        className="btn"
        disabled={isSubmitting || !canSubmit}
      >
        Create Heist
      </button>
    </form>
  );
}
