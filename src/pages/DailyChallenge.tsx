import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getTodayDate, seedFromDate, getDailyChallengeResult, getDailyChallengeResults, clearDailyChallengeResults } from '../storage/localStore';

// Daily Challenge scenario
export interface DailyScenario {
  date: string;
  seed: number;
  distanceM: number;
  windMps: number;
  gustMps: number;
  env: {
    temperatureC: number;
    altitudeM: number;
  };
  targetMode: 'bullseye' | 'plates';
  maxShots: number;
}

/**
 * Generate a deterministic daily challenge scenario from seed
 * @param seed - The seed to generate from
 * @returns Daily scenario configuration
 */
function generateScenarioFromSeed(seed: number): DailyScenario {
  // Simple pseudo-random number generator for determinism
  const rng = (state: number) => {
    const stateInt = Math.floor(state * 2147483647.0) % 2147483647;
    const newState = (stateInt * 16807) % 2147483647;
    return {
      value: (newState - 1) / 2147483646.0, // Normalized 0-1
      newState,
    };
  };
  
  let state = seed % 2147483647;
  
  // Generate parameters within safe bounds
  const r1 = rng(state);
  state = r1.newState;
  const r2 = rng(state);
  state = r2.newState;
  const r3 = rng(state);
  state = r3.newState;
  const r4 = rng(state);
  state = r4.newState;
  const r5 = rng(state);
  state = r5.newState;
  const r6 = rng(state);
  state = r6.newState;
  
  // Distance: 50-300m (biased towards 100-200m)
  const distanceM = 50 + Math.floor(Math.pow(r1.value, 0.5) * 250);
  
  // Wind: -10 to 10 m/s (more likely to have some wind)
  const wind = (r2.value * 20 - 10) * (r3.value > 0.5 ? 1 : 0); // 50% chance of calm
  const windMps = Math.round(wind * 10) / 10;
  
  // Gust: 0 to 5 m/s (only if there's wind)
  const gustMps = windMps !== 0 ? Math.round(r4.value * 50) / 10 : 0;
  
  // Temperature: -20 to 35°C
  const temperatureC = Math.round(r5.value * 55 - 20);
  
  // Altitude: 0 to 3000m
  const altitudeM = Math.floor(r6.value * 3000);
  
  // Target mode (30% chance of plates)
  const targetMode: 'bullseye' | 'plates' = r6.value < 0.3 ? 'plates' : 'bullseye';
  
  return {
    date: getTodayDate(),
    seed,
    distanceM,
    windMps,
    gustMps,
    env: {
      temperatureC,
      altitudeM,
    },
    targetMode,
    maxShots: 3,
  };
}

/**
 * Daily Challenge page component
 */
export function DailyChallenge() {
  const [dateOverride] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('dateOverride') || undefined;
  });
  
  const today = getTodayDate(dateOverride);
  const seed = seedFromDate(today);
  const scenario = generateScenarioFromSeed(seed);
  const existingResult = getDailyChallengeResult(today);
  
  const [results] = useState(getDailyChallengeResults());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <div className="main-menu">
      <div className="menu-content">
        <h2>Daily Challenge</h2>
        <p>Today's unique shooting challenge!</p>
        
        {dateOverride && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '4px' }}>
            <small>⚠️ Testing mode: Date override = {dateOverride}</small>
          </div>
        )}
        
        {/* Today's Challenge */}
        <div
          style={{
            background: '#1a1a2e',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}
          data-testid="daily-challenge-info"
        >
          <h3 style={{ marginTop: 0 }}>{formatDate(today)}</h3>
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
            <div><strong>Distance:</strong> {scenario.distanceM}m</div>
            <div><strong>Wind:</strong> {scenario.windMps >= 0 ? '+' : ''}{scenario.windMps} m/s ±{scenario.gustMps} m/s</div>
            <div><strong>Temp:</strong> {scenario.env.temperatureC}°C</div>
            <div><strong>Altitude:</strong> {scenario.env.altitudeM}m</div>
            <div><strong>Mode:</strong> {scenario.targetMode === 'bullseye' ? 'Bullseye' : 'Plates'}</div>
            <div><strong>Shots:</strong> {scenario.maxShots}</div>
          </div>
          
          {existingResult ? (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(76, 175, 80, 0.2)',
                borderRadius: '4px',
              }}
              data-testid="daily-results"
            >
              <div>✓ <strong>Completed</strong></div>
              <div>Score: {existingResult.score} | Stars: {existingResult.stars}★ | Group: {(existingResult.groupSizeMeters * 1000).toFixed(0)}mils</div>
            </div>
          ) : (
            <Link
              to={`/game/daily-challenge?seed=${seed}`}
              style={{
                display: 'block',
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: '#e94560',
                color: 'white',
                textAlign: 'center',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
              data-testid="start-daily-btn"
            >
              Start Daily Challenge
            </Link>
          )}
        </div>
        
        {/* Leaderboard */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Your Results
            <button
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                background: 'transparent',
                color: '#e94560',
                border: '1px solid #e94560',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              data-testid="reset-leaderboard-btn"
            >
              Reset
            </button>
          </h3>
          
          {showResetConfirm && (
            <div
              style={{
                padding: '1rem',
                background: '#fff3cd',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              <small>
                Clear all daily challenge results? This cannot be undone.
                <br />
                <small>
                  <button
                    onClick={clearDailyChallengeResults}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Yes, Clear All
                  </button>{' '}
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      background: 'transparent',
                      color: '#333',
                      border: '1px solid #333',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </small>
              </small>
            </div>
          )}
          
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
            data-testid="leaderboard-list"
          >
            {results.length === 0 ? (
              <li
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#666',
                  fontStyle: 'italic',
                }}
              >
                No challenges completed yet
              </li>
            ) : (
              results.map((result) => (
                <li
                  key={result.date}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{formatDate(result.date)}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {result.stars}★ {result.score} pts
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {(result.groupSizeMeters * 1000).toFixed(0)} mils
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        
        <Link to="/" className="menu-button" style={{ textAlign: 'center' }}>
          ← Back to Main Menu
        </Link>
      </div>
    </div>
  );
}