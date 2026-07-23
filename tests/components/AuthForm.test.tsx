import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { FirebaseError } from "firebase/app";

const mockSignIn = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockPush = vi.fn();
const mockClaimCodename = vi.fn();
const mockIsCodenameAvailable = vi.fn();

vi.mock("@/lib/firebase", () => ({ auth: {} }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUser(...args),
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  AuthErrorCodes: {
    EMAIL_EXISTS: "auth/email-already-in-use",
    WEAK_PASSWORD: "auth/weak-password",
    INVALID_EMAIL: "auth/invalid-email",
    INVALID_LOGIN_CREDENTIALS: "auth/invalid-credential",
    INVALID_PASSWORD: "auth/wrong-password",
    USER_DISABLED: "auth/user-disabled",
  },
}));

const { FakeCodenameTakenError } = vi.hoisted(() => {
  class FakeCodenameTakenError extends Error {}
  return { FakeCodenameTakenError };
});

vi.mock("@/lib/codenames", () => ({
  claimCodenameAndCreateUser: (...args: unknown[]) =>
    mockClaimCodename(...args),
  isCodenameAvailable: (...args: unknown[]) => mockIsCodenameAvailable(...args),
  CodenameTakenError: FakeCodenameTakenError,
}));

// komponentimporter
import AuthForm from "@/components/AuthForm";

const fakeUser = { uid: "uid-1" };

describe("AuthForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockSignIn.mockReset();
    mockCreateUser.mockReset();
    mockDeleteUser.mockReset();
    mockPush.mockReset();
    mockClaimCodename.mockReset();
    mockIsCodenameAvailable.mockReset();
  });

  it("renders email and password fields in login mode", () => {
    render(<AuthForm initialMode="login" />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("does not render a codename field in login mode", () => {
    render(<AuthForm initialMode="login" />);

    expect(screen.queryByLabelText(/codename/i)).not.toBeInTheDocument();
  });

  it("renders a codename field with suggestion chips in signup mode", () => {
    render(<AuthForm initialMode="signup" />);

    expect(screen.getByLabelText(/codename/i)).toBeInTheDocument();
    const chips = screen.getAllByRole("button", { name: /^@/ });
    expect(chips.length).toBeGreaterThan(0);
  });

  it("fills the codename field when a suggestion chip is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="signup" />);

    const chip = screen.getAllByRole("button", { name: /^@/ })[0];
    await user.click(chip);

    expect(screen.getByLabelText(/codename/i)).toHaveValue(chip.textContent);
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

  it("clears email, password and codename fields when toggling modes", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");

    // växlingsknappen (inte submit-knappen) byter läge
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByLabelText(/email/i)).toHaveValue("");
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("");
    expect(screen.getByLabelText(/codename/i)).toHaveValue("");
  });

  it("shows errors and does not call Firebase when submitting empty fields", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows a codename error and does not call Firebase when submitting signup with an empty codename", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByText(/codename is required/i)).toBeInTheDocument();
    expect(mockCreateUser).not.toHaveBeenCalled();
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

  it("creates the account, claims the codename and redirects on a valid signup submit", async () => {
    mockIsCodenameAvailable.mockResolvedValue(true);
    mockCreateUser.mockResolvedValue({ user: fakeUser });
    mockClaimCodename.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<AuthForm initialMode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.type(screen.getByLabelText(/codename/i), "@NightOwl");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(mockIsCodenameAvailable).toHaveBeenCalledWith("@NightOwl"),
    );
    await waitFor(() =>
      expect(mockCreateUser).toHaveBeenCalledWith(
        {},
        "thief@heist.io",
        "secret",
      ),
    );
    await waitFor(() =>
      expect(mockClaimCodename).toHaveBeenCalledWith("uid-1", "@NightOwl"),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/heists"));
    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
  });

  it("shows a codename error and never creates an account when the codename is already taken", async () => {
    mockIsCodenameAvailable.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<AuthForm initialMode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.type(screen.getByLabelText(/codename/i), "@NightOwl");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockClaimCodename).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("rolls back the new account and shows an error if the codename is claimed by someone else in the brief race window", async () => {
    // isCodenameAvailable sa ledigt, men den atomiska transaktionen upptäcker
    // en krock (t.ex. någon annan hann registrera samma kodnamn precis innan).
    mockIsCodenameAvailable.mockResolvedValue(true);
    mockCreateUser.mockResolvedValue({ user: fakeUser });
    mockClaimCodename.mockRejectedValue(new FakeCodenameTakenError("taken"));
    const user = userEvent.setup();
    render(<AuthForm initialMode="signup" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.type(screen.getByLabelText(/codename/i), "@NightOwl");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
    expect(mockDeleteUser).toHaveBeenCalledWith(fakeUser);
    expect(mockPush).not.toHaveBeenCalled();
    // e-post/lösenord finns kvar så användaren kan välja ett nytt kodnamn utan att skriva om allt
    expect(screen.getByLabelText(/email/i)).toHaveValue("thief@heist.io");
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
