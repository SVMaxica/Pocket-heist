import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";

const mockCollection = vi.fn();
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockPush = vi.fn();
const mockUseAuthState = vi.fn();

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("@/lib/useAuthState", () => ({
  useAuthState: () => mockUseAuthState(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ __isTimestamp: true, toDate: () => date }),
  },
}));

// komponentimporter
import CreateHeistForm from "@/components/CreateHeistForm";

const ME = { id: "me", codename: "@Me", createdAt: new Date() };
const COLLEAGUE = { id: "other", codename: "@Other", createdAt: new Date() };

function mockCollectionRef() {
  return { withConverter: () => ({}) };
}

function usersSnapshot(users: { id: string; codename: string }[]) {
  return { docs: users.map((u) => ({ data: () => u })) };
}

describe("CreateHeistForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockCollection.mockReset();
    mockGetDocs.mockReset();
    mockAddDoc.mockReset();
    mockPush.mockReset();
    mockUseAuthState.mockReset();
  });

  it("shows a loader while the assignable users are being fetched", () => {
    mockUseAuthState.mockReturnValue({
      status: "authenticated",
      user: { uid: "me" },
      error: null,
    });
    mockCollection.mockReturnValue(mockCollectionRef());
    mockGetDocs.mockReturnValue(new Promise(() => {})); // never resolves

    render(<CreateHeistForm />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders title/description fields and the assignable coworkers, excluding the current user", async () => {
    mockUseAuthState.mockReturnValue({
      status: "authenticated",
      user: { uid: "me" },
      error: null,
    });
    mockCollection.mockReturnValue(mockCollectionRef());
    mockGetDocs.mockResolvedValue(usersSnapshot([ME, COLLEAGUE]));

    render(<CreateHeistForm />);

    expect(await screen.findByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "@Other" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "@Me" }),
    ).not.toBeInTheDocument();
  });

  it("shows a message and blocks submission when there is no one else to assign a heist to", async () => {
    mockUseAuthState.mockReturnValue({
      status: "authenticated",
      user: { uid: "me" },
      error: null,
    });
    mockCollection.mockReturnValue(mockCollectionRef());
    mockGetDocs.mockResolvedValue(usersSnapshot([ME]));

    render(<CreateHeistForm />);

    expect(
      await screen.findByText(/no one else to assign/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create heist/i }),
    ).toBeDisabled();
  });

  it("shows an error message when the assignable users fail to load", async () => {
    mockUseAuthState.mockReturnValue({
      status: "authenticated",
      user: { uid: "me" },
      error: null,
    });
    mockCollection.mockReturnValue(mockCollectionRef());
    mockGetDocs.mockRejectedValue(new Error("network error"));

    render(<CreateHeistForm />);

    expect(
      await screen.findByText(/could not load coworkers/i),
    ).toBeInTheDocument();
  });

  it("creates the heist with the right payload and redirects on a valid submit", async () => {
    mockUseAuthState.mockReturnValue({
      status: "authenticated",
      user: { uid: "me" },
      error: null,
    });
    mockCollection.mockReturnValue(mockCollectionRef());
    mockGetDocs.mockResolvedValue(usersSnapshot([ME, COLLEAGUE]));
    mockAddDoc.mockResolvedValue({});

    const user = userEvent.setup();
    render(<CreateHeistForm />);

    await user.type(await screen.findByLabelText(/title/i), "Sticky notes");
    await user.type(
      screen.getByLabelText(/description/i),
      "Leave a trail on their desk",
    );
    await user.selectOptions(screen.getByLabelText(/assign to/i), "@Other");
    await user.click(screen.getByRole("button", { name: /create heist/i }));

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload).toMatchObject({
      title: "Sticky notes",
      description: "Leave a trail on their desk",
      createdBy: "me",
      createdByCodename: "@Me",
      assignedTo: "other",
      assignedToCodename: "@Other",
      finalStatus: null,
    });
    expect(payload.createdAt).toBeTruthy();
    expect(payload.deadline).toBeTruthy();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/heists"));
  });

  it("shows an error and keeps the entered data when creating the heist fails", async () => {
    mockUseAuthState.mockReturnValue({
      status: "authenticated",
      user: { uid: "me" },
      error: null,
    });
    mockCollection.mockReturnValue(mockCollectionRef());
    mockGetDocs.mockResolvedValue(usersSnapshot([ME, COLLEAGUE]));
    mockAddDoc.mockRejectedValue(new Error("write failed"));

    const user = userEvent.setup();
    render(<CreateHeistForm />);

    await user.type(await screen.findByLabelText(/title/i), "Sticky notes");
    await user.type(
      screen.getByLabelText(/description/i),
      "Leave a trail on their desk",
    );
    await user.selectOptions(screen.getByLabelText(/assign to/i), "@Other");
    await user.click(screen.getByRole("button", { name: /create heist/i }));

    expect(
      await screen.findByText(/could not create the heist/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue("Sticky notes");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows validation errors and does not write when required fields are empty", async () => {
    mockUseAuthState.mockReturnValue({
      status: "authenticated",
      user: { uid: "me" },
      error: null,
    });
    mockCollection.mockReturnValue(mockCollectionRef());
    mockGetDocs.mockResolvedValue(usersSnapshot([ME, COLLEAGUE]));

    const user = userEvent.setup();
    render(<CreateHeistForm />);

    await user.click(
      await screen.findByRole("button", { name: /create heist/i }),
    );

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/choose who to assign/i)).toBeInTheDocument();
    expect(mockAddDoc).not.toHaveBeenCalled();
  });
});
