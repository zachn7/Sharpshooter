import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LEVEL_PACKS, getLevelsByPackWithUnlock, calculateStars, LEVELS } from '../data/levels';
import { getLevelProgress, getPackStars, getPackMaxStars } from '../storage';
import { Target, Lock, Star, Wind } from 'lucide-react';

export function Levels() {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice as string | undefined;

  const handleLevelClick = (levelId: string) => {
    navigate(`/game/${levelId}`);
  };

  const renderStars = (stars: 0 | 1 | 2 | 3) => {
    return (
      <div className="level-stars">
        {[1, 2, 3].map((num) => (
          <Star
            key={num}
            size={16}
            fill={num <= stars ? 'currentColor' : 'none'}
            className={num <= stars ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'var(--color-success-500)',
      medium: 'var(--color-warning-500)',
      hard: 'var(--color-accent-500)',
      expert: 'var(--color-error-500)',
    };
    return colors[difficulty] || 'var(--color-primary-500)';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: 'EASY',
      medium: 'MEDIUM',
      hard: 'HARD',
      expert: 'EXPERT',
    };
    return labels[difficulty] || difficulty.toUpperCase();
  };

  const getWeaponIcon = (_weaponType: string) => {
    return <Target size={16} />;
  };

  const allLevelIds = LEVELS.map(l => l.id);

  return (
    <div className="levels-page page-transition" data-testid="levels-page">
      <div className="page-header">
        <Link to="/" className="back-button" data-testid="back-button">
          ← Back
        </Link>
        <h2>Levels</h2>
      </div>
      
      {/* Notice banner for when user is redirected from invalid route */}
      {notice && (
        <div className="notice-banner" data-testid="notice-banner">
          {notice}
        </div>
      )}
      
      <div className="level-packs-container">
        {LEVEL_PACKS.map((pack) => {
          const levels = getLevelsByPackWithUnlock(pack.id, allLevelIds, getLevelProgress);
          const earnedStars = getPackStars(pack.levels);
          const maxStars = getPackMaxStars(pack.levels);

          return (
            <div 
              key={pack.id} 
              className="level-pack-card" 
              data-testid={`pack-${pack.id}`}
            >
              {/* Pack Header */}
              <div className="pack-header">
                <div className="pack-header-left">
                  <div className="pack-weapon-badge">
                    {getWeaponIcon(pack.weaponType)}
                    <span>{pack.weaponType.toUpperCase()}</span>
                  </div>
                  <h3 className="pack-name">{pack.name}</h3>
                </div>
                <div className="pack-progress">
                  <div className="pack-stars">
                    {earnedStars > 0 && (
                      <Star size={16} fill="currentColor" className="star-filled" />
                    )}
                    <span className="pack-stars-text">
                      {earnedStars}/{maxStars}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Pack Description */}
              <p className="pack-description">{pack.description}</p>

              {/* Level List */}
              <div className="level-list">
                {levels.length === 0 ? (
                  <p className="empty-levels">No levels in this pack.</p>
                ) : (
                  levels.map((level) => {
                    const progress = getLevelProgress(level.id);
                    const levelStars = progress ? calculateStars(progress.bestScore, level.starThresholds) : 0;

                    return (
                      <button
                        key={level.id}
                        className={`level-card ${level.unlocked ? 'unlocked' : 'locked'}`}
                        data-testid={`level-${level.id}`}
                        onClick={() => level.unlocked && handleLevelClick(level.id)}
                        disabled={!level.unlocked}
                      >
                        <div className="level-card-header">
                          <div className="level-header-left">
                            {!level.unlocked && (
                              <Lock size={18} className="lock-icon" />
                            )}
                            <span className="level-name">{level.name}</span>
                          </div>
                          {level.unlocked && renderStars(levelStars)}
                        </div>
                        
                        <div className="level-card-body">
                          <div className="level-metadata">
                            <div 
                              className="difficulty-badge"
                              style={{ backgroundColor: getDifficultyColor(level.difficulty) }}
                            >
                              {getDifficultyLabel(level.difficulty)}
                            </div>
                            <div className="level-params">
                              <span className="level-param">
                                <Target size={14} /> {level.distanceM}m
                              </span>
                              {level.windMps && level.windMps !== 0 && (
                                <span className="level-param">
                                  <Wind size={14} /> {Math.abs(level.windMps)}m/s
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="level-description">{level.description}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}