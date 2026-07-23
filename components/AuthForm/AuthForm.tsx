"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  AuthErrorCodes,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import {
  claimCodenameAndCreateUser,
  isCodenameAvailable,
  CodenameTakenError,
} from "@/lib/codenames";
import { generateCodenameSuggestions } from "@/lib/codenameSuggestions";
import styles from "./AuthForm.module.css";

export type AuthMode = "login" | "signup";

interface AuthFormProps {
  initialMode: AuthMode;
}

interface FormErrors {
  email?: string;
  password?: string;
  codename?: string;
  form?: string;
}

// enkel e-postkontroll — avsiktligt inte fullständig RFC 5322
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TITLES: Record<AuthMode, string> = {
  login: "Sneak Back In",
  signup: "Signup for an Account",
};

const SUBMIT_LABELS: Record<AuthMode, string> = {
  login: "Log In",
  signup: "Sign Up",
};

// AuthErrorCodes-värdena är redan "auth/..."-koderna som Firebase kastar
function getAuthErrorMessage(mode: AuthMode, code: string): string {
  switch (code) {
    case AuthErrorCodes.EMAIL_EXISTS:
      return "An account with this email already exists";
    case AuthErrorCodes.WEAK_PASSWORD:
      return "Password is too weak — use at least 6 characters";
    case AuthErrorCodes.INVALID_EMAIL:
      return "Enter a valid email address";
    case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
    case AuthErrorCodes.INVALID_PASSWORD:
      return "Incorrect email or password";
    case AuthErrorCodes.USER_DISABLED:
      return "This account has been disabled";
    case "auth/too-many-requests":
      return "Too many attempts — please try again later";
    default:
      return mode === "login"
        ? "Could not log in. Please try again."
        : "Could not create account. Please try again.";
  }
}

export default function AuthForm({ initialMode }: AuthFormProps) {
  const router = useRouter();
  // initialMode läses bara en gång — läget ändras därefter enbart via växlingsknappen,
  // inte av prop-ändringar (avsiktligt)
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codename, setCodename] = useState("");
  const [suggestions] = useState(() => generateCodenameSuggestions());
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  }

  function handleCodenameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setCodename(event.target.value);
    if (errors.codename) {
      setErrors((prev) => ({ ...prev, codename: undefined }));
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setCodename(suggestion);
    if (errors.codename) {
      setErrors((prev) => ({ ...prev, codename: undefined }));
    }
  }

  function handleTogglePasswordVisibility() {
    setShowPassword((prev) => !prev);
  }

  function handleToggleMode() {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setEmail("");
    setPassword("");
    setCodename("");
    setErrors({});
    setShowPassword(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (email === "") {
      nextErrors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (password === "") {
      nextErrors.password = "Password is required";
    }

    if (mode === "signup" && codename.trim() === "") {
      nextErrors.codename = "Codename is required";
    }

    if (nextErrors.email || nextErrors.password || nextErrors.codename) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        // Kollas innan kontot skapas: en lyckad createUserWithEmailAndPassword
        // gör användaren omedelbart inloggad, vilket triggar route-guards
        // (redirect bort från /signup) innan en eventuell rollback hinner ske.
        const available = await isCodenameAvailable(codename);
        if (!available) {
          setErrors({ codename: "That codename is already taken" });
          setIsSubmitting(false);
          return;
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        try {
          await claimCodenameAndCreateUser(credential.user.uid, codename);
        } catch (codenameError) {
          await deleteUser(credential.user);
          setErrors(
            codenameError instanceof CodenameTakenError
              ? { codename: "That codename is already taken" }
              : { form: "Could not create account. Please try again." },
          );
          setIsSubmitting(false);
          return;
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/heists");
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : "unknown";
      setErrors({ form: getAuthErrorMessage(mode, code) });
      setIsSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h1 className="form-title">{TITLES[mode]}</h1>

      <div className={styles.field}>
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "auth-email-error" : undefined}
        />
        {errors.email && (
          <p id="auth-email-error" className={styles.error}>
            {errors.email}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="auth-password">Password</label>
        <div className={styles.passwordField}>
          <input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            autoComplete={isLogin ? "current-password" : "new-password"}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? "auth-password-error" : undefined
            }
          />
          <button
            type="button"
            className={styles.toggleVisibility}
            onClick={handleTogglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p id="auth-password-error" className={styles.error}>
            {errors.password}
          </p>
        )}
      </div>

      {mode === "signup" && (
        <div className={styles.field}>
          <label htmlFor="auth-codename">Codename</label>
          <input
            id="auth-codename"
            type="text"
            value={codename}
            onChange={handleCodenameChange}
            aria-invalid={errors.codename ? true : undefined}
            aria-describedby={
              errors.codename ? "auth-codename-error" : undefined
            }
          />
          <div className={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                className={styles.suggestionChip}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          {errors.codename && (
            <p id="auth-codename-error" className={styles.error}>
              {errors.codename}
            </p>
          )}
        </div>
      )}

      {errors.form && (
        <p role="alert" className={styles.error}>
          {errors.form}
        </p>
      )}

      <button type="submit" className="btn" disabled={isSubmitting}>
        {SUBMIT_LABELS[mode]}
      </button>

      <p className={styles.toggleModePrompt}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className={styles.toggleModeButton}
          onClick={handleToggleMode}
        >
          {isLogin ? "Sign Up" : "Log In"}
        </button>
      </p>
    </form>
  );
}
