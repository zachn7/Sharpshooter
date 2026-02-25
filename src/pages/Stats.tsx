
import { getPlayerStats } from '../storage';

export function Stats() {
  const stats = getPlayerStats();

  const formatPlayTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="page" data-testid="stats-page">
      <h2>Player Statistics</h2>

      <div className="stats-container">
        <div className="stats-section" data-testid="stats-accuracy">
          <h3>Accuracy</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalShotsFired}</div>
              <div className="stat-label">Total Shots</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalBullseyes}</div>
              <div className="stat-label">Bullseyes</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalCenters}</div>
              <div className="stat-label">Perfect Centers</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {stats.totalShotsFired > 0
                  ? ((stats.totalBullseyes / stats.totalShotsFired) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <div className="stat-label">Bullseye Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {stats.averageOffsetMils.toFixed(2)} MIL
              </div>
              <div className="stat-label">Avg. Offset</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {stats.bestGroupSizeMils < 100 ? stats.bestGroupSizeMils.toFixed(2) + ' MIL' : '--'}
              </div>
              <div className="stat-label">Best Group (3-shot)</div>
            </div>
          </div>
        </div>

        <div className="stats-section" data-testid="stats-progress">
          <h3>Progress</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.levelsCompleted}</div>
              <div className="stat-label">Levels Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.packsCompleted}</div>
              <div className="stat-label">Packs Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.dailyChallengesCompleted}</div>
              <div className="stat-label">Daily Challenges</div>
            </div>
          </div>
        </div>

        <div className="stats-section" data-testid="stats-playtime">
          <h3>Play Time</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-value">{formatPlayTime(stats.totalPlayTimeMs)}</div>
              <div className="stat-label">Total Play Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.currentStreak}</div>
              <div className="stat-label">Current Streak (days)</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.longestStreak}</div>
              <div className="stat-label">Longest Streak (days)</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatDate(stats.lastPlayDate)}</div>
              <div className="stat-label">Last Played</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
