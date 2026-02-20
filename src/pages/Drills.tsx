import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DRILLS, generateDrillScenario } from '../data/drills';
import { getDrillPersonalBest, type DrillPersonalBests } from '../storage';

export function Drills() {
  const [searchParams] = useSearchParams();
  const attemptNumber = parseInt(searchParams.get('attempt') || '1', 10);
  
  // Load personal bests for all drills
  const [personalBests] = useState<Record<string, DrillPersonalBests[string] | undefined>>(() => {
    const pb: Record<string, DrillPersonalBests[string] | undefined> = {};
    DRILLS.forEach(drill => {
      pb[drill.id] = getDrillPersonalBest(drill.id);
    });
    return pb;
  });

  return (
    <div className="drills-page" data-testid="drills-page">
      <div className="menu-content">
        <h2>Training Drills</h2>
        <p>Sharpen your skills with targeted practice!</p>
        
        {/* Drills List */}
        <div className="drills-list">
          {DRILLS.map(drill => {
            const pb = personalBests[drill.id];
            const scenario = generateDrillScenario(drill.id, attemptNumber);
            
            return (
              <div
                key={drill.id}
                className="drill-card"
                data-testid={`drill-card-${drill.id}`}
              >
                <h3>{drill.name}</h3>
                <p className="drill-description">{drill.description}</p>
                
                <div className="drill-info">
                  <div><strong>Shots:</strong> {drill.maxShots}</div>
                  {drill.timeLimit && (
                    <div><strong>Time Limit:</strong> {drill.timeLimit}s</div>
                  )}
                  <div><strong>Distance:</strong> {scenario.distanceM}m</div>
                  <div><strong>Wind:</strong> {scenario.windMps >= 0 ? '+' : ''}{scenario.windMps} m/s ±{scenario.gustMps} m/s</div>
                </div>
                
                {pb && (
                  <div className="drill-pb">
                    <strong>Personal Best:</strong>{' '}
                    {pb.bestScore} points
                    {pb.bestTime && ` (${pb.bestTime.toFixed(1)}s)`}
                  </div>
                )}
                
                <Link
                  to={`/game/${drill.id}?mode=drill&seed=${scenario.seed}`}
                  className="drill-start-button"
                  data-testid={`drill-start-${drill.id}`}
                >
                  Start Drill
                </Link>
              </div>
            );
          })}
        </div>
        
        {/* Attempt Number (for testing) */}
        {attemptNumber > 1 && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '4px' }}>
            <small>⚠️ Testing mode: Attempt #{attemptNumber}</small>
          </div>
        )}
        
        <div className="back-link">
          <Link to="/" data-testid="back-to-menu">← Back to Menu</Link>
        </div>
      </div>
    </div>
  );
}
