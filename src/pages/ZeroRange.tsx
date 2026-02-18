import { useState } from 'react';
import { Game } from './Game';
import { getZeroRangeShotLimitMode, setZeroRangeShotLimitMode, type ZeroRangeShotLimitMode } from '../storage';

/**
 * Zero Range page - special level for zeroing weapons
 * Uses wind=0 and distance=weapon's zero distance
 */
export function ZeroRange() {
  const [shotLimitMode, setShotLimitMode] = useState<ZeroRangeShotLimitMode>(
    () => getZeroRangeShotLimitMode()
  );

  const handleToggleMode = () => {
    const newMode: ZeroRangeShotLimitMode = shotLimitMode === 'unlimited' ? 'three' : 'unlimited';
    setShotLimitMode(newMode);
    setZeroRangeShotLimitMode(newMode);
  };

  return (
    <div className="zero-range-page" data-testid="zero-range-page">
      <div className="zero-range-controls" data-testid="zero-range-controls">
        <span className="zero-mode-label" data-testid="zero-mode-label">
          {shotLimitMode === 'unlimited' ? 'Practice (∞)' : 'Practice (3)'}
        </span>
        <button
          onClick={handleToggleMode}
          className="zero-shot-limit-toggle"
          data-testid="zero-shot-limit-toggle"
        >
          {shotLimitMode === 'unlimited' ? 'Switch to 3-Shot Mode' : 'Switch to Unlimited Mode'}
        </button>
      </div>
      <Game isZeroRange shotLimitMode={shotLimitMode} />
    </div>
  );
}