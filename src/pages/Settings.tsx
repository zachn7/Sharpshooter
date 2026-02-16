import { useState } from 'react';

interface SettingSection {
  id: string;
  title: string;
  settings: { id: string; label: string; type: 'toggle' | 'preset' }[];
}

const settingsConfig: SettingSection[] = [
  {
    id: 'gameplay',
    title: 'Gameplay',
    settings: [
      { id: 'realism-preset', label: 'Realism Preset', type: 'preset' },
      { id: 'show-hud', label: 'Show HUD', type: 'toggle' },
      { id: 'sound-effects', label: 'Sound Effects', type: 'toggle' },
    ],
  },
  {
    id: 'graphics',
    title: 'Graphics',
    settings: [
      { id: 'high-quality', label: 'High Quality', type: 'toggle' },
      { id: 'animations', label: 'Animations', type: 'toggle' },
    ],
  },
];

export function Settings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [selectedPreset, setSelectedPreset] = useState('arcade');

  const handleToggle = (settingId: string) => {
    setToggles((prev) => ({ ...prev, [settingId]: !prev[settingId] }));
  };

  return (
    <div className="settings-page" data-testid="settings-page">
      <h2>Settings</h2>
      {settingsConfig.map((section) => (
        <div key={section.id} className="settings-section">
          <h3>{section.title}</h3>
          <div className="settings-list">
            {section.settings.map((setting) => (
              <div key={setting.id} className="setting-item">
                <span className="setting-label">{setting.label}</span>
                {setting.type === 'toggle' ? (
                  <button
                    className={`toggle-button ${toggles[setting.id] ? 'on' : 'off'}`}
                    onClick={() => handleToggle(setting.id)}
                    data-testid={`toggle-${setting.id}`}
                    aria-pressed={toggles[setting.id]}
                  >
                    {toggles[setting.id] ? 'ON' : 'OFF'}
                  </button>
                ) : (
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="preset-select"
                    data-testid={setting.id}
                  >
                    <option value="arcade">Arcade</option>
                    <option value="realistic">Realistic</option>
                    <option value="hardcore">Hardcore</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
