import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getGameSettings, 
  updateGameSettings, 
  type GameSettings, 
  type RealismPreset 
} from '../storage';

const REALISM_PRESETS: { id: RealismPreset; label: string; description: string }[] = [
  {
    id: 'arcade',
    label: 'Arcade',
    description: 'Reduced drag and wind - easier aiming',
  },
  {
    id: 'realistic',
    label: 'Realistic',
    description: 'Standard ballistics - authentic experience',
  },
  {
    id: 'expert',
    label: 'Expert',
    description: 'Enhanced drag and wind - ultimate challenge',
  },
];

export function Settings() {
  const [settings, setSettings] = useState<GameSettings>(() => getGameSettings());

  const handlePresetChange = (preset: RealismPreset) => {
    if (!settings) return;
    const updated = updateGameSettings({ realismPreset: preset });
    setSettings(updated.settings);
  };

  const handleToggleChange = (key: keyof GameSettings) => {
    if (!settings) return;
    const currentValue = settings[key] as boolean;
    const updated = updateGameSettings({ [key]: !currentValue } as Partial<GameSettings>);
    setSettings(updated.settings);
  };

  if (!settings) {
    return (
      <div className="settings-page" data-testid="settings-page">
        <div className="page-header">
          <Link to="/" className="back-button" data-testid="back-button">
            ← Back
          </Link>
          <h2>Settings</h2>
        </div>
        <div className="settings-container">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page" data-testid="settings-page">
      <div className="page-header">
        <Link to="/" className="back-button" data-testid="back-button">
          ← Back
        </Link>
        <h2>Settings</h2>
      </div>

      <div className="settings-container">
        {/* Realism Presets Section */}
        <div className="settings-section" data-testid="realism-section">
          <h3>Realism Preset</h3>
          <p className="setting-description">
            Choose your experience level. Affects drag and wind difficulty.
          </p>
          <div className="preset-group" role="radiogroup" aria-label="Realism preset">
            {REALISM_PRESETS.map((preset) => (
              <label
                key={preset.id}
                className={`preset-card ${
                  settings.realismPreset === preset.id ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="realismPreset"
                  value={preset.id}
                  checked={settings.realismPreset === preset.id}
                  onChange={() => handlePresetChange(preset.id)}
                  data-testid={`preset-${preset.id}`}
                  className="preset-radio"
                />
                <div className="preset-content">
                  <h4>{preset.label}</h4>
                  <p>{preset.description}</p>
                </div>
                {settings.realismPreset === preset.id && (
                  <div className="preset-check">✓</div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* HUD Visibility Section */}
        <div className="settings-section" data-testid="hud-section">
          <h3>HUD Visibility</h3>
          <p className="setting-description">
            Customize what information is shown during gameplay.
          </p>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Show HUD</span>
                <span className="setting-sublabel">
                  Display wind indicator and shot history
                </span>
              </div>
              <button
                className={`toggle-button ${settings.showHud ? 'on' : 'off'}`}
                onClick={() => handleToggleChange('showHud')}
                data-testid="toggle-show-hud"
                aria-pressed={settings.showHud}
              >
                {settings.showHud ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Show Shot Trace</span>
                <span className="setting-sublabel">
                  Display trajectory path (Coming Soon)
                </span>
              </div>
              <button
                className={`toggle-button ${settings.showShotTrace ? 'on' : 'off'}`}
                onClick={() => handleToggleChange('showShotTrace')}
                data-testid="toggle-show-shot-trace"
                aria-pressed={settings.showShotTrace}
                disabled
              >
                {settings.showShotTrace ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Show Mil Offset</span>
                <span className="setting-sublabel">
                  Display mil/meter offset readout (Coming Soon)
                </span>
              </div>
              <button
                className={`toggle-button ${settings.showMilOffset ? 'on' : 'off'}`}
                onClick={() => handleToggleChange('showMilOffset')}
                data-testid="toggle-show-mil-offset"
                aria-pressed={settings.showMilOffset}
                disabled
              >
                {settings.showMilOffset ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}