import { Planet } from '../../core/models/planet';
import { Rarity } from '../../core/models/rarity';
import { AnswerResult } from '../../core/services/scoring-service';

/** One colored mark per answer, matching the level colors of the game. */
const LEVEL_MARKS: Record<Rarity, string> = {
  satellite: '🔵',
  meteorite: '🟢',
  comet: '🟣',
  pulsar: '🩷',
  supernova: '🟠',
};
const ZERO_MARK = '⚫';

/** Short text to share a round: where the rocket got, the points and one mark per answer. */
export function shareText(
  destination: Planet,
  points: number,
  results: (AnswerResult | undefined)[],
  url: string,
): string {
  const marks = results.map((result) =>
    result?.match ? LEVEL_MARKS[result.match.rarity] : ZERO_MARK,
  );
  return `🚀 Órbita: cheguei ${destination.toName} com ${points} pts!\n${marks.join('')}\n${url}`;
}
