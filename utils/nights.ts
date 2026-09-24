import type { Visit } from '../types';

// a night at the park runs roughly 6pm to 2am, so any visit within this window
// of the night's first visit counts as the same night, even across midnight
export const NIGHT_WINDOW_MS = 8 * 60 * 60 * 1000;

export type Night = {
  // timestamp of the night's first visit
  start: string;
  visits: Visit[];
};

// groups visits into nights, oldest first, with each night's visits in time order
export function groupVisitsIntoNights(visits: Visit[]): Night[] {
  const sorted = [...visits].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const nights: Night[] = [];
  let current: Night | null = null;
  let currentStartMs = 0;

  sorted.forEach((visit) => {
    const ms = new Date(visit.timestamp).getTime();
    if (!current || ms - currentStartMs > NIGHT_WINDOW_MS) {
      current = { start: visit.timestamp, visits: [] };
      currentStartMs = ms;
      nights.push(current);
    }
    current.visits.push(visit);
  });

  return nights;
}
