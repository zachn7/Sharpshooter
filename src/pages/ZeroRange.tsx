import { Game } from './Game';

/**
 * Zero Range page - special level for zeroing weapons
 * Uses wind=0 and distance=weapon's zero distance
 */
export function ZeroRange() {
  return (
    <div className="zero-range-page" data-testid="zero-range-page">
      <Game />
    </div>
  );
}