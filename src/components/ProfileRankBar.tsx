import { Trophy } from 'lucide-react';
import { getPlayerProfileProgress } from '../storage';

interface ProfileRankBarProps {
  compact?: boolean;
  className?: string;
}

export function ProfileRankBar({ compact = false, className = '' }: ProfileRankBarProps) {
  const profile = getPlayerProfileProgress();
  const progressPercent = Math.round(profile.progressToNext * 100);

  return (
    <section
      className={`profile-rank-bar ${compact ? 'compact' : ''} ${className}`.trim()}
      data-testid={compact ? 'profile-rank-bar-compact' : 'profile-rank-bar'}
      aria-label="Player profile progression"
    >
      <div className="profile-rank-summary">
        <div className="profile-rank-badge" aria-hidden="true">
          <Trophy size={compact ? 16 : 20} />
        </div>
        <div className="profile-rank-text">
          <span className="profile-rank-kicker">Profile Rank</span>
          <strong>Level {profile.level}</strong>
        </div>
      </div>

      <div className="profile-rank-progress">
        <div className="profile-rank-progress-header">
          <span>{profile.currentLevelXp}/{profile.nextLevelXp} XP</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="profile-rank-track" aria-hidden="true">
          <div className="profile-rank-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </section>
  );
}
