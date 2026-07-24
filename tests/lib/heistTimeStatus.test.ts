import { describe, it, expect } from "vitest";
import { getHeistTimeStatus } from "@/lib/heistTimeStatus";

const NOW = new Date("2026-07-24T12:00:00Z");

function inFuture(days: number, hours: number, minutes: number): Date {
  const ms = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
  return new Date(NOW.getTime() + ms);
}

describe("getHeistTimeStatus", () => {
  it("marks a past deadline as overdue", () => {
    const deadline = new Date(NOW.getTime() - 60 * 60 * 1000);

    expect(getHeistTimeStatus(deadline, NOW)).toEqual({
      label: "Overdue",
      isOverdue: true,
    });
  });

  it("treats a deadline equal to now as overdue", () => {
    expect(getHeistTimeStatus(NOW, NOW)).toEqual({
      label: "Overdue",
      isOverdue: true,
    });
  });

  it("formats hours and minutes when under a day remains", () => {
    expect(getHeistTimeStatus(inFuture(0, 4, 42), NOW)).toEqual({
      label: "4h 42m",
      isOverdue: false,
    });
  });

  it("keeps the 0h prefix when only minutes remain", () => {
    expect(getHeistTimeStatus(inFuture(0, 0, 5), NOW)).toEqual({
      label: "0h 5m",
      isOverdue: false,
    });
  });

  it("formats exactly one day as days and hours", () => {
    expect(getHeistTimeStatus(inFuture(1, 0, 0), NOW)).toEqual({
      label: "1d 0h",
      isOverdue: false,
    });
  });

  it("formats multiple days as days and hours, dropping minutes", () => {
    expect(getHeistTimeStatus(inFuture(2, 3, 30), NOW)).toEqual({
      label: "2d 3h",
      isOverdue: false,
    });
  });

  it("uses the injected now instead of the system clock", () => {
    // Deadline ligger i det förflutna relativt systemklockan men i framtiden
    // relativt den injicerade `now`, så resultatet bevisar att `now` används.
    const injectedNow = new Date("2000-01-01T00:00:00Z");
    const deadline = new Date(injectedNow.getTime() + 30 * 60 * 1000);

    expect(getHeistTimeStatus(deadline, injectedNow)).toEqual({
      label: "0h 30m",
      isOverdue: false,
    });
  });
});
