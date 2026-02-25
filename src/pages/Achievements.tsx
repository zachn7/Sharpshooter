
import { getPlayerAchievements, getUnlockedAchievementIds } from '../storage';
import { ACHIEVEMENT_DEFINITIONS, getAchievementsByType } from '../storage/achievements';
import { type AchievementType } from '../storage';
import { RETICLE_SKINS } from '../storage/reticleSkins';

export function Achievements() {
  const achievements = getPlayerAchievements();
  const unlockedIds = getUnlockedAchievementIds();

  const types: AchievementType[] = ['progress', 'skill', 'exploration'];

  return (
    <div className="page" data-testid="achievements-page">
      <h2>Achievements & Cosmetics</h2>

      <div className="achievements-container">
        <div className="achievements-summary" data-testid="achievements-summary">
          <div className="summary-item">
            <div className="summary-value">{unlockedIds.size}</div>
            <div className="summary-label">Unlocked</div>
          </div>
          <div className="summary-item">
            <div className="summary-value">{ACHIEVEMENT_DEFINITIONS.length}</div>
            <div className="summary-label">Total</div>
          </div>
        </div>

        {types.map(type => (
          <div key={type} className="achievement-section">
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Achievements</h3>
            <div className="achievement-list">
              {getAchievementsByType(type).map(achievement => {
                const progress = achievements[achievement.id];
                const unlocked = progress?.unlocked || false;
                const currentProgress = progress?.progress || 0;

                return (
                  <div
                    key={achievement.id}
                    className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-description">{achievement.description}</div>
                      {!unlocked && (
                        <div className="achievement-progress">
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min((currentProgress / achievement.target) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="progress-text">
                            {currentProgress} / {achievement.target}
                          </div>
                        </div>
                      )}
                      {unlocked && (
                        <div className="achievement-badge">✓ Unlocked</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="cosmetics-section">
          <h3>Reticle Skins</h3>
          <div className="cosmetics-list">
            {RETICLE_SKINS.map(skin => {
              const unlocked = skin.achievementId === null || unlockedIds.has(skin.achievementId);
              const achievement = skin.achievementId
                ? ACHIEVEMENT_DEFINITIONS.find(a => a.id === skin.achievementId)
                : null;

              return (
                <div
                  key={skin.id}
                  className={`cosmetic-card ${unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div
                    className="cosmetic-preview"
                    style={{
                      backgroundColor: skin.colorPrimary,
                      color: skin.colorSecondary,
                    }}
                  >
                    {skin.thickness > 0 && <span className="thickness-indicator">{skin.thickness}px</span>}
                  </div>
                  <div className="cosmetic-info">
                    <div className="cosmetic-name">{skin.name}</div>
                    <div className="cosmetic-description">{skin.description}</div>
                    {!unlocked && achievement && (
                      <div className="cosmetic-lock-hint">
                        🔒 Unlock: {achievement.title}
                      </div>
                    )}
                    {unlocked && (
                      <div className="cosmetic-badge">✓ Unlocked</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
