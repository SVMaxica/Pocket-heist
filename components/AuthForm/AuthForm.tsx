"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./AuthForm.module.css";

export type AuthMode = "login" | "signup";

interface AuthFormProps {
  initialMode: AuthMode;
}

interface FormErrors {
  email?: string;
  password?: string;
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

export default function AuthForm({ initialMode }: AuthFormProps) {
  // initialMode läses bara en gång — läget ändras därefter enbart via växlingsknappen,
  // inte av prop-ändringar (avsiktligt)
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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

  function handleTogglePasswordVisibility() {
    setShowPassword((prev) => !prev);
  }

  function handleToggleMode() {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setEmail("");
    setPassword("");
    setErrors({});
    setShowPassword(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    console.log({ mode, email, password });
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

      <button type="submit" className="btn">
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
