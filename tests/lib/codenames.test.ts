import { describe, it, expect, vi, afterEach } from "vitest";

const mockDoc = vi.fn();
const mockRunTransaction = vi.fn();
const mockGetDoc = vi.fn();

vi.mock("@/lib/firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ __isTimestamp: true, toDate: () => date }),
  },
}));

import {
  claimCodenameAndCreateUser,
  isCodenameAvailable,
  normalizeCodename,
  CodenameTakenError,
} from "@/lib/codenames";

interface FakeTransaction {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

function makeFakeTransaction(codenameExists: boolean): FakeTransaction {
  return {
    get: vi.fn().mockResolvedValue({ exists: () => codenameExists }),
    set: vi.fn(),
  };
}

function runWithFakeTransaction(transaction: FakeTransaction) {
  mockRunTransaction.mockImplementation((_db, callback) =>
    callback(transaction),
  );
}

describe("normalizeCodename", () => {
  it("trims and lowercases the codename", () => {
    expect(normalizeCodename("  NightOwl  ")).toBe("nightowl");
  });
});

describe("isCodenameAvailable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockDoc.mockReset();
    mockGetDoc.mockReset();
  });

  it("returns true when no reservation doc exists for the normalized codename", async () => {
    mockDoc.mockImplementation((_db, collection, id) => ({ collection, id }));
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(isCodenameAvailable("  NightOwl  ")).resolves.toBe(true);
    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      "codenames",
      "nightowl",
    );
  });

  it("returns false when a reservation doc already exists", async () => {
    mockDoc.mockImplementation((_db, collection, id) => ({ collection, id }));
    mockGetDoc.mockResolvedValue({ exists: () => true });

    await expect(isCodenameAvailable("NightOwl")).resolves.toBe(false);
  });
});

describe("claimCodenameAndCreateUser", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockDoc.mockReset();
    mockRunTransaction.mockReset();
  });

  it("reserves the codename and creates the user profile when the codename is free", async () => {
    const transaction = makeFakeTransaction(false);
    runWithFakeTransaction(transaction);
    mockDoc.mockImplementation((_db, collection, id) => ({ collection, id }));

    const now = new Date("2026-07-22T12:00:00.000Z");
    await claimCodenameAndCreateUser("uid-1", "  NightOwl  ", now);

    expect(mockDoc).toHaveBeenCalledWith(
      expect.anything(),
      "codenames",
      "nightowl",
    );
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "users", "uid-1");

    expect(transaction.set).toHaveBeenCalledWith(
      { collection: "codenames", id: "nightowl" },
      {
        uid: "uid-1",
        codename: "NightOwl",
        createdAt: { __isTimestamp: true, toDate: expect.any(Function) },
      },
    );
    expect(transaction.set).toHaveBeenCalledWith(
      { collection: "users", id: "uid-1" },
      {
        codename: "NightOwl",
        createdAt: { __isTimestamp: true, toDate: expect.any(Function) },
      },
    );
  });

  it("throws CodenameTakenError and writes nothing when the codename is already reserved", async () => {
    const transaction = makeFakeTransaction(true);
    runWithFakeTransaction(transaction);
    mockDoc.mockImplementation((_db, collection, id) => ({ collection, id }));

    await expect(
      claimCodenameAndCreateUser("uid-1", "NightOwl"),
    ).rejects.toBeInstanceOf(CodenameTakenError);

    expect(transaction.set).not.toHaveBeenCalled();
  });
});
