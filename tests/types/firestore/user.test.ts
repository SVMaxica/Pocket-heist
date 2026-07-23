import { describe, it, expect } from "vitest";
import { Timestamp, type QueryDocumentSnapshot } from "firebase/firestore";

import {
  buildCreateUserInput,
  userConverter,
  type User,
} from "@/types/firestore/user";

describe("buildCreateUserInput", () => {
  it("sets createdAt to now", () => {
    const now = new Date("2026-07-22T12:00:00.000Z");

    const input = buildCreateUserInput("@NightOwl", now);

    expect(input.codename).toBe("@NightOwl");
    expect(input.createdAt).toBeInstanceOf(Timestamp);
    expect(input.createdAt.toDate().toISOString()).toBe(
      "2026-07-22T12:00:00.000Z",
    );
  });
});

describe("userConverter", () => {
  it("passes a user straight through when writing (Firestore converts Timestamp itself)", () => {
    const user: User = {
      id: "uid-1",
      codename: "@NightOwl",
      createdAt: new Date("2026-07-22T12:00:00.000Z"),
    };

    expect(userConverter.toFirestore(user)).toBe(user);
  });

  it("converts the Firestore Timestamp back to a Date and includes the doc id when reading", () => {
    const createdAt = new Date("2026-07-22T12:00:00.000Z");
    const snapshot = {
      id: "uid-1",
      data: () => ({
        codename: "@NightOwl",
        createdAt: Timestamp.fromDate(createdAt),
      }),
    } as unknown as QueryDocumentSnapshot;

    const user = userConverter.fromFirestore(snapshot);

    expect(user.id).toBe("uid-1");
    expect(user.codename).toBe("@NightOwl");
    expect(user.createdAt).toEqual(createdAt);
  });
});
