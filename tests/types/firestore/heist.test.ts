import { describe, it, expect } from "vitest";
import { Timestamp, type QueryDocumentSnapshot } from "firebase/firestore";

import {
  buildCreateHeistInput,
  heistConverter,
  type CreateHeistInput,
  type Heist,
} from "@/types/firestore/heist";

const fields: Omit<CreateHeistInput, "deadline" | "finalStatus"> = {
  title: "Leave a mysterious sticky note",
  description: "On someone's desk",
  createdBy: "uid-creator",
  createdByCodename: "@NightOwl",
  assignedTo: "uid-assignee",
  assignedToCodename: "@SecretSauceAgent",
};

describe("buildCreateHeistInput", () => {
  it("sets the deadline to 48 hours from now and finalStatus to null", () => {
    const now = new Date("2026-07-22T12:00:00.000Z");

    const input = buildCreateHeistInput(fields, now);

    expect(input.deadline).toBeInstanceOf(Timestamp);
    expect(input.deadline.toDate().toISOString()).toBe(
      "2026-07-24T12:00:00.000Z",
    );
    expect(input.finalStatus).toBeNull();
    expect(input.title).toBe(fields.title);
  });
});

describe("heistConverter", () => {
  it("passes create input straight through when writing (Firestore converts Timestamp itself)", () => {
    const input = buildCreateHeistInput(
      fields,
      new Date("2026-07-22T12:00:00.000Z"),
    );

    expect(heistConverter.toFirestore(input)).toBe(input);
  });

  it("converts the Firestore Timestamp deadline back to a Date and includes the doc id when reading", () => {
    const deadline = new Date("2026-07-24T12:00:00.000Z");
    const snapshot = {
      id: "heist-123",
      data: () => ({
        ...fields,
        deadline: Timestamp.fromDate(deadline),
        finalStatus: "success",
      }),
    } as unknown as QueryDocumentSnapshot;

    const heist: Heist = heistConverter.fromFirestore(snapshot);

    expect(heist.id).toBe("heist-123");
    expect(heist.deadline).toEqual(deadline);
    expect(heist.finalStatus).toBe("success");
    expect(heist.title).toBe(fields.title);
  });
});
