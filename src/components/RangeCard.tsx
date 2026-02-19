/**
 * Range Card Component
 * 
 * Displays per-shot telemetry and totals for completed level sessions.
 */

import type { RangeCard, RangeCardShotRow, RangeCardTotals as Totals } from '../types';
import { shotToRow, calculateTotals, generateSummary } from '../utils/rangeCard';

interface RangeCardProps {
  rangeCard: RangeCard;
  className?: string;
}

export function RangeCard({ rangeCard, className = '' }: RangeCardProps) {
  const rows: RangeCardShotRow[] = rangeCard.shots.map(shotToRow);
  const totals: Totals = calculateTotals(rangeCard.shots);
  const summary = generateSummary(totals, rangeCard.shots);

  return (
    <div className={`range-card ${className}`} data-testid="range-card">
      <div className="range-card-header">
        <h2>Range Card</h2>
        <div className="range-card-meta">
          <span>{rangeCard.levelName}</span>
          <span>{rangeCard.distanceM}m</span>
        </div>
      </div>

      <div className="range-card-summary">{summary}</div>

      {rows.length > 0 && (
        <table className="range-card-table">
          <thead>
            <tr>
              <th>Shot</th>
              <th>Wind</th>
              <th>Dials</th>
              <th>Time</th>
              <th>Impact</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.shotNumber}>
                <td>#{row.shotNumber}</td>
                <td>{row.windUsed}</td>
                <td>{row.dials}</td>
                <td>{row.timeOfFlight}</td>
                <td>{row.impact}</td>
                <td className={row.score === 10 ? 'bullseye' : ''}>{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rows.length === 0 && (
        <p className="no-shots">No shots recorded</p>
      )}
    </div>
  );
}