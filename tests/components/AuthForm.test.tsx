import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { FirebaseError } from "firebase/app";

const mockSignIn = vi.fn();
const mockCreateUser = vi.fn();
const mockPush = vi.fn();

vi.mock("@/lib/firebase", () => ({ auth: {} }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUser(...args),
  AuthErrorCodes: {
    EMAIL_EXISTS: "auth/email-already-in-use",
    WEAK_PASSWORD: "auth/weak-password",
    INVALID_EMAIL: "auth/invalid-email",
    INVALID_LOGIN_CREDENTIALS: "auth/invalid-credential",
    INVALID_PASSWORD: "auth/wrong-password",
    USER_DISABLED: "auth/user-disabled",
  },
}));

// komponentimporter
import AuthForm from "@/components/AuthForm";

describe("AuthForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockSignIn.mockReset();
    mockCreateUser.mockReset();
    mockPush.mockReset();
  });

  it("renders email and password fields in login mode", () => {
    render(<AuthForm initialMode="login" />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("shows the Log In submit button in login mode", () => {
    render(<AuthForm initialMode="login" />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows the Sign Up submit button in signup mode", () => {
    render(<AuthForm initialMode="signup" />);

    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("toggles password visibility when the show/hide icon is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("does not submit the form when the visibility toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.click(screen.getByRole("button", { name: /show password/i }));
    await user.click(screen.getByRole("button", { name: /hide password/i }));

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("switches to signup mode and updates the title and submit button when toggled", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    expect(
      screen.getByRole("heading", { name: /sneak back in/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      screen.getByRole("heading", { name: /signup for an account/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^sign up$/i })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("clears email and password fields when toggling modes", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");

    // växlingsknappen (inte submit-knappen) byter läge
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByLabelText(/email/i)).toHaveValue("");
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("");
  });

  it("shows errors and does not call Firebase when submitting empty fields", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows an error and does not call Firebase when the email is invalid", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      screen.getByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("clears the email error as soon as the field is edited again", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.click(screen.getByRole("button", { name: /log in/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), "t");
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it("calls signInWithEmailAndPassword and shows no errors on a valid login submit", async () => {
    mockSignIn.mockResolvedValue({});
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith({}, "thief@heist.io", "secret"),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/heists"));
    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
  });

  it("calls createUserWithEmailAndPassword on a valid signup submit", async () => {
    mockCreateUser.mockResolvedValue({});
    const user = userEvent.setup();
    render(<AuthForm initialMode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(mockCreateUser).toHaveBeenCalledWith(
        {},
        "thief@heist.io",
        "secret",
      ),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/heists"));
    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
  });

  it("shows a form-level error message when Firebase rejects the submission", async () => {
    mockSignIn.mockRejectedValue(
      new FirebaseError("auth/invalid-credential", "Invalid credential"),
    );
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      await screen.findByText(/incorrect email or password/i),
    ).toBeInTheDocument();
  });
});
