// Härleder en visningsbar tidsstatus för en heists deadline. `isOverdue`
// hålls separat från `label` så att statusen aldrig kommuniceras enbart via
// färg — texten själv ("Overdue"/tid kvar) bär informationen.
export interface HeistTimeStatus {
  label: string;
  isOverdue: boolean;
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

// `now` injiceras (default = nu) enligt samma mönster som buildCreateHeistInput,
// så att tidsberäkningen går att testa deterministiskt.
export function getHeistTimeStatus(
  deadline: Date,
  now: Date = new Date(),
): HeistTimeStatus {
  const diffMs = deadline.getTime() - now.getTime();

  // `<= 0` täcker gränsfallet där deadline precis passerat men heisten ännu
  // ligger kvar i active/assigned-listan.
  if (diffMs <= 0) {
    return { label: "Overdue", isOverdue: true };
  }

  // Math.floor genomgående så att kvarvarande tid aldrig avrundas optimistiskt.
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  const label = days >= 1 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;

  return { label, isOverdue: false };
}
