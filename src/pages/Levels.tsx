import { Link, useNavigate } from 'react-router-dom';
import { LEVEL_PACKS, getLevelsByPack, calculateStars } from '../data/levels';
import { getLevelProgress, getPackStars, getPackMaxStars } from '../storage';

export function Levels() {
  const navigate = useNavigate();

  const handleLevelClick = (levelId: string) => {
    navigate(`/game/${levelId}`);
  };

  const renderStars = (stars: 0 | 1 | 2 | 3) => {
    return '★'.repeat(stars) + '☆'.repeat(3 - stars);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: '#4ade80',
      medium: '#facc15',
      hard: '#f97316',
      expert: '#ef4444',
    };
    return colors[difficulty] || '#ffffff';
  };

  return (
    <div className="levels-page" data-testid="levels-page">
      <div className="page-header">
        <Link to="/" className="back-button" data-testid="back-button">
          ← Back
        </Link>
        <h2>Levels</h2>
      </div>
      
      <div className="level-packs">
        {LEVEL_PACKS.map((pack) => {
          const levels = getLevelsByPack(pack.id);
          const earnedStars = getPackStars(pack.levels);
          const maxStars = getPackMaxStars(pack.levels);

          return (
            <div key={pack.id} className="level-pack" data-testid={`level-pack-${pack.id}`}>
              <div className="pack-header">
                <h3 className="pack-name">{pack.name}</h3>
                <span className="pack-weapon-type">{pack.weaponType.toUpperCase()}</span>
              </div>
              
              <p className="pack-description">{pack.description}</p>
              
              <div className="pack-stars">
                <span className="star-counter">
                  {renderStars(earnedStars as 0 | 1 | 2 | 3)} {earnedStars}/{maxStars}
                </span>
              </div>

              <div className="level-list">
                {levels.length === 0 ? (
                  <p className="empty-levels">No levels in this pack.</p>
                ) : (
                  levels.map((level) => {
                    const progress = getLevelProgress(level.id);
                    const earnedStars = progress ? calculateStars(progress.bestScore, level.starThresholds) : 0;

                    return (
                      <button
                        key={level.id}
                        className={`level-item ${level.unlocked ? 'unlocked' : 'locked'}`}
                        data-testid={`level-${level.id}`}
                        onClick={() => level.unlocked && handleLevelClick(level.id)}
                        disabled={!level.unlocked}
                      >
                        <div className="level-info">
                          <span className="level-name">{level.name}</span>
                          {!level.unlocked && <span className="lock-icon">🔒</span>}
                        </div>
                        
                        <div className="level-details">
                          <div className="level-meta">
                            <span className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(level.difficulty) }}>
                              {level.difficulty.toUpperCase()}
                            </span>
                            <span className="level-param">{level.distanceM}m</span>
                            <span className="level-param">{level.windMps}m/s wind</span>
                          </div>
                          
                          <div className="level-stars">
                            {renderStars(earnedStars)}
                          </div>
                        </div>
                        
                        <p className="level-description">{level.description}</p>
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
