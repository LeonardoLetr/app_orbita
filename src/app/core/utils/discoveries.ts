import { Discoveries, Discovery, RoundRecord } from '../models/progress';
import { normalizeAnswer } from './normalize-answer';

/** An answer the player found in a round, for the first time. */
export interface NewDiscovery {
  categoryId: string;
  /** Key of the answer in the logbook. */
  key: string;
}

/**
 * Key of an answer in the logbook: its official text, normalized, so that however it was
 * typed ("narval", "Narval", a synonym) it is the same discovery.
 */
export function discoveryKey(text: string): string {
  return normalizeAnswer(text);
}

/** The answers of a round that scored, each with its category. */
function scoredIn(round: Pick<RoundRecord, 'answers'>): NewDiscovery[] {
  return round.answers.flatMap(({ categoryId, result }) =>
    result.match ? [{ categoryId, key: discoveryKey(result.match.text) }] : [],
  );
}

/** What a round brings that is not in the logbook yet, each answer once. */
export function newDiscoveries(
  discoveries: Discoveries,
  round: Pick<RoundRecord, 'answers'>,
): NewDiscovery[] {
  const seen = new Set<string>();
  return scoredIn(round).filter(({ categoryId, key }) => {
    const id = `${categoryId}/${key}`;
    if (seen.has(id) || discoveries[categoryId]?.[key]) {
      return false;
    }
    seen.add(id);
    return true;
  });
}

/** The logbook with the scored answers of a round written in. */
export function withRound(
  discoveries: Discoveries,
  round: Pick<RoundRecord, 'answers' | 'playedAt'>,
): Discoveries {
  const next: Discoveries = { ...discoveries };
  for (const { categoryId, key } of scoredIn(round)) {
    const known: Discovery | undefined = next[categoryId]?.[key];
    next[categoryId] = {
      ...next[categoryId],
      [key]: { first: known?.first ?? round.playedAt, times: (known?.times ?? 0) + 1 },
    };
  }
  return next;
}

/** A logbook made from saved rounds, given newest first as they are kept. */
export function fromRounds(rounds: readonly RoundRecord[]): Discoveries {
  return [...rounds].reverse().reduce(withRound, {} as Discoveries);
}

/** How many answers are in the logbook. */
export function countDiscoveries(discoveries: Discoveries): number {
  return Object.values(discoveries).reduce((total, found) => total + Object.keys(found).length, 0);
}
