import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";

// komponentimporter
import AuthForm from "@/components/AuthForm";

describe("AuthForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<AuthForm initialMode="login" />);

    await user.click(screen.getByRole("button", { name: /show password/i }));
    await user.click(screen.getByRole("button", { name: /hide password/i }));

    expect(logSpy).not.toHaveBeenCalled();
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

  it("shows errors and does not log when submitting empty fields", async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<AuthForm initialMode="login" />);

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("shows an error and does not log when the email is invalid", async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<AuthForm initialMode="login" />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(
      screen.getByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("clears the email error as soon as the field is edited again", async () => {
    const user = userEvent.setup();
    render(<AuthForm initialMode="login" />);

    await user.click(screen.getByRole("button", { name: /log in/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), "t");
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it("logs the credentials and shows no errors on a valid submit", async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<AuthForm initialMode="login" />);

    await user.type(screen.getByLabelText(/email/i), "thief@heist.io");
    await user.type(screen.getByLabelText(/^password$/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(logSpy).toHaveBeenCalledWith({
      mode: "login",
      email: "thief@heist.io",
      password: "secret",
    });
    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
  });
});
