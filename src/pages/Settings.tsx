import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  getGameSettings,
  updateGameSettings,
  getSelectedWeaponId,
  saveZeroProfile,
  getZeroProfile,
  serializeAppState,
  deserializeAppState,
  clearSaveData,
  clearDailyChallengeResults,
  clearTutorialsSeen,
  type GameSettings,
  type RealismPreset,
  type ZeroProfile
} from '../storage';
import { getDefaultShowNumericWind } from '../physics/windCues';

const ZERO_DISTANCE_OPTIONS = [25, 50, 100, 200] as const;

type ZeroDistanceOption = typeof ZERO_DISTANCE_OPTIONS[number];

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
  const [selectedWeaponId] = useState(() => getSelectedWeaponId());
  const [zeroDistance, setZeroDistance] = useState<ZeroDistanceOption>(() => {
    const weaponId = getSelectedWeaponId();
    const profile = getZeroProfile(weaponId);
    return (profile?.zeroDistanceM || 0) as ZeroDistanceOption;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importMigrated, setImportMigrated] = useState(false);
  const [fromVersion, setFromVersion] = useState<number | undefined>();

  const handlePresetChange = (preset: RealismPreset) => {
    if (!settings) return;
    const defaultShowNumericWind = getDefaultShowNumericWind(preset);
    const updated = updateGameSettings({ 
      realismPreset: preset,
      showNumericWind: defaultShowNumericWind 
    });
    setSettings(updated.settings);
  };

  const handleToggleChange = (key: keyof GameSettings) => {
    if (!settings) return;
    const currentValue = settings[key] as boolean;
    const updated = updateGameSettings({ [key]: !currentValue } as Partial<GameSettings>);
    setSettings(updated.settings);
  };

  const handleAudioVolumeChange = (value: number) => {
    if (!settings) return;
    const updated = updateGameSettings({
      audio: {
        ...settings.audio,
        masterVolume: value,
      },
    });
    setSettings(updated.settings);
  };

  const handleAudioToggleChange = (key: 'isMuted' | 'reducedAudio') => {
    if (!settings) return;
    const currentValue = settings.audio[key];
    const updated = updateGameSettings({
      audio: {
        ...settings.audio,
        [key]: !currentValue,
      },
    });
    setSettings(updated.settings);
  };

  const handleVfxToggleChange = (key: 'reducedMotion' | 'reducedFlash' | 'recordShotPath') => {
    if (!settings) return;
    const currentValue = settings.vfx[key];
    const updated = updateGameSettings({
      vfx: {
        ...settings.vfx,
        [key]: !currentValue,
      },
    });
    setSettings(updated.settings);
  };

  const handleReticleStyleChange = (style: 'simple' | 'mil' | 'tree') => {
    if (!settings) return;
    const updated = updateGameSettings({
      reticle: {
        ...settings.reticle,
        style,
      },
    });
    setSettings(updated.settings);
  };

  const handleReticleThicknessChange = (thickness: number) => {
    if (!settings) return;
    const updated = updateGameSettings({
      reticle: {
        ...settings.reticle,
        thickness: Math.max(1, Math.min(5, thickness)),
      },
    });
    setSettings(updated.settings);
  };

  const handleReticleCenterDotToggleChange = () => {
    if (!settings) return;
    const updated = updateGameSettings({
      reticle: {
        ...settings.reticle,
        centerDot: !settings.reticle.centerDot,
      },
    });
    setSettings(updated.settings);
  };

  const handleOffsetUnitChange = (unit: 'mil' | 'moa') => {
    if (!settings) return;
    const updated = updateGameSettings({
      display: {
        ...settings.display,
        offsetUnit: unit,
      },
    });
    setSettings(updated.settings);
  };

  const handleZeroDistanceChange = async (distance: number) => {
    setZeroDistance(distance as ZeroDistanceOption);

    // Get or create profile
    const profile: ZeroProfile = {
      zeroDistanceM: distance,
      zeroElevationMils: 0.0,
      zeroWindageMils: 0.0,
    };

    saveZeroProfile(selectedWeaponId, profile);
  };

  const handleExport = () => {
    try {
      const state = serializeAppState();
      const jsonString = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `sharpshooter-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);
    setImportMigrated(false);
    setFromVersion(undefined);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = deserializeAppState(content);

        if (result.success) {
          setImportSuccess(true);
          setImportMigrated(!!result.migrated);
          setFromVersion(result.fromVersion);

          // Reload the page to refresh all state
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setImportError(result.error || 'Import failed');
        }
      } catch {
        setImportError('Failed to read file');
      }
    };

    reader.readAsText(file);

    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    try {
      clearSaveData();
      clearDailyChallengeResults();
      clearTutorialsSeen();
      window.location.reload();
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Reset failed. Please try again.');
      setShowResetConfirm(false);
    }
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
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

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Show Numeric Wind</span>
                <span className="setting-sublabel">
                  Display wind values (off by default for Realistic/Expert)
                </span>
              </div>
              <button
                className={`toggle-button ${settings.showNumericWind ? 'on' : 'off'}`}
                onClick={() => handleToggleChange('showNumericWind')}
                data-testid="toggle-show-numeric-wind"
                aria-pressed={settings.showNumericWind}
              >
                {settings.showNumericWind ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Expert Sim Extras Section */}
        {settings.realismPreset === 'expert' && (
          <div className="settings-section" data-testid="expert-extras-section">
            <h3>Expert Sim Extras</h3>
            <p className="setting-description">
              Advanced simulation effects for additional challenge. These are gameplay approximations, not real-world guidance.
            </p>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Spin Drift</span>
                  <span className="setting-sublabel">
                    Sim extras: Add rightward bullet curve from rotation
                  </span>
                </div>
                <button
                  className={`toggle-button ${settings.expertSpinDriftEnabled ? 'on' : 'off'}`}
                  onClick={() => handleToggleChange('expertSpinDriftEnabled')}
                  data-testid="toggle-expert-spin-drift"
                  aria-pressed={settings.expertSpinDriftEnabled}
                >
                  {settings.expertSpinDriftEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Coriolis Effect</span>
                  <span className="setting-sublabel">
                    Sim extras: Add Earth rotation-based deflections
                  </span>
                </div>
                <button
                  className={`toggle-button ${settings.expertCoriolisEnabled ? 'on' : 'off'}`}
                  onClick={() => handleToggleChange('expertCoriolisEnabled')}
                  data-testid="toggle-expert-coriolis"
                  aria-pressed={settings.expertCoriolisEnabled}
                >
                  {settings.expertCoriolisEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audio Settings Section */}
        <div className="settings-section" data-testid="audio-section">
          <h3>Audio</h3>
          <p className="setting-description">
            Customize sound effects volume and preferences.
          </p>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Master Volume</span>
                <span className="setting-sublabel">All sound effects</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.audio.masterVolume}
                onChange={(e) => handleAudioVolumeChange(Number(e.target.value))}
                disabled={settings.audio.isMuted}
                className="volume-slider"
                data-testid="master-volume"
                aria-label="Master volume"
              />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Mute</span>
                <span className="setting-sublabel">Disable all sounds</span>
              </div>
              <button
                className={`toggle-button ${settings.audio.isMuted ? 'on' : 'off'}`}
                onClick={() => handleAudioToggleChange('isMuted')}
                data-testid="toggle-audio-mute"
                aria-pressed={settings.audio.isMuted}
              >
                {settings.audio.isMuted ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Reduced Audio</span>
                <span className="setting-sublabel">Quieter sound effects</span>
              </div>
              <button
                className={`toggle-button ${settings.audio.reducedAudio ? 'on' : 'off'}`}
                onClick={() => handleAudioToggleChange('reducedAudio')}
                data-testid="toggle-reduced-audio"
                aria-pressed={settings.audio.reducedAudio}
              >
                {settings.audio.reducedAudio ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* VFX Accessibility Section */}
        <div className="settings-section" data-testid="vfx-section">
          <h3>Visual Effects</h3>
          <p className="setting-description">
            Customize visual effects and animations for accessibility.
          </p>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Reduced Motion</span>
                <span className="setting-sublabel">
                  Disable trails, flash, and screen shake
                </span>
              </div>
              <button
                className={`toggle-button ${settings.vfx.reducedMotion ? 'on' : 'off'}`}
                onClick={() => handleVfxToggleChange('reducedMotion')}
                data-testid="toggle-reduced-motion"
                aria-pressed={settings.vfx.reducedMotion}
              >
                {settings.vfx.reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Reduced Flash</span>
                <span className="setting-sublabel">
                  Disable muzzle flash effects
                </span>
              </div>
              <button
                className={`toggle-button ${settings.vfx.reducedFlash ? 'on' : 'off'}`}
                onClick={() => handleVfxToggleChange('reducedFlash')}
                disabled={settings.vfx.reducedMotion}
                data-testid="toggle-reduced-flash"
                aria-pressed={settings.vfx.reducedFlash}
              >
                {settings.vfx.reducedFlash ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Record Shot Path</span>
                <span className="setting-sublabel">
                  Save shot trajectories for replay
                </span>
              </div>
              <button
                className={`toggle-button ${settings.vfx.recordShotPath ? 'on' : 'off'}`}
                onClick={() => handleVfxToggleChange('recordShotPath')}
                disabled={settings.vfx.reducedMotion}
                data-testid="toggle-record-shot-path"
                aria-pressed={settings.vfx.recordShotPath}
              >
                {settings.vfx.recordShotPath ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Reticle Settings Section */}
        <div className="settings-section" data-testid="reticle-section">
          <h3>Reticle</h3>
          <p className="setting-description">
            Customize the aiming reticle appearance and display options.
          </p>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Style</span>
                <span className="setting-sublabel">
                  Choose reticle pattern
                </span>
              </div>
              <div className="setting-options">
                <button
                  className={`option-button ${settings.reticle.style === 'simple' ? 'active' : ''}`}
                  onClick={() => handleReticleStyleChange('simple')}
                  data-testid="reticle-style-simple"
                >
                  Simple
                </button>
                <button
                  className={`option-button ${settings.reticle.style === 'mil' ? 'active' : ''}`}
                  onClick={() => handleReticleStyleChange('mil')}
                  data-testid="reticle-style-mil"
                >
                  MIL
                </button>
                <button
                  className={`option-button ${settings.reticle.style === 'tree' ? 'active' : ''}`}
                  onClick={() => handleReticleStyleChange('tree')}
                  data-testid="reticle-style-tree"
                >
                  Tree
                </button>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Thickness</span>
                <span className="setting-sublabel">
                  Line thickness: {settings.reticle.thickness}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={settings.reticle.thickness}
                onChange={(e) => handleReticleThicknessChange(Number(e.target.value))}
                className="range-slider"
                data-testid="reticle-thickness"
                aria-label="Reticle thickness"
              />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Center Dot</span>
                <span className="setting-sublabel">
                  Show dot at reticle center
                </span>
              </div>
              <button
                className={`toggle-button ${settings.reticle.centerDot ? 'on' : 'off'}`}
                onClick={handleReticleCenterDotToggleChange}
                data-testid="reticle-center-dot"
                aria-pressed={settings.reticle.centerDot}
              >
                {settings.reticle.centerDot ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings Section */}
        <div className="settings-section" data-testid="display-section">
          <h3>Display</h3>
          <p className="setting-description">
            Configure display units and readout preferences.
          </p>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Offset Units</span>
                <span className="setting-sublabel">
                  Unit for impact offset display
                </span>
              </div>
              <div className="setting-options">
                <button
                  className={`option-button ${settings.display.offsetUnit === 'mil' ? 'active' : ''}`}
                  onClick={() => handleOffsetUnitChange('mil')}
                  data-testid="offset-units-mil"
                >
                  MIL
                </button>
                <button
                  className={`option-button ${settings.display.offsetUnit === 'moa' ? 'active' : ''}`}
                  onClick={() => handleOffsetUnitChange('moa')}
                  data-testid="offset-units-moa"
                >
                  MOA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zero Distance Section */}
        <div className="settings-section" data-testid="zeroing-section">
          <h3>Zero Settings</h3>
          <p className="setting-description">
            Set zero distance for each weapon and access zero range for calibration.
          </p>
          
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Zero Distance</span>
              <span className="setting-sublabel">
                Distance at which turret is adjusted to hit center
              </span>
            </div>
            <select
              value={zeroDistance}
              onChange={(e) => handleZeroDistanceChange(Number(e.target.value))}
              className="preset-select"
              data-testid="zero-distance-select"
            >
              <option value={0}>Not Set</option>
              {ZERO_DISTANCE_OPTIONS.map((distance) => (
                <option key={distance} value={distance}>
                  {distance}m
                </option>
              ))}
            </select>
          </div>
          
          <div className="setting-item">
            <Link to="/zero" className="zero-link-button" data-testid="go-to-zero-range">
              Go to Zero Range
            </Link>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="settings-section" data-testid="data-section">
          <h3>Data Management</h3>
          <p className="setting-description">
            Export your progress, settings, and daily challenge scores to a JSON file, or import a backup to restore your data.
          </p>

          {/* Export Button */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Export Data</span>
              <span className="setting-sublabel">
                Download a JSON backup of your progress and settings
              </span>
            </div>
            <button
              onClick={handleExport}
              className="action-button"
              data-testid="export-save"
            >
              Export
            </button>
          </div>

          {/* Import Button */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Import Data</span>
              <span className="setting-sublabel">
                Restore from a JSON backup file
              </span>
            </div>
            <div className="data-import-wrapper">
              <button
                onClick={handleImportClick}
                className="action-button"
                data-testid="import-save"
              >
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                data-testid="import-file-input"
              />
            </div>
          </div>

          {/* Import Status Messages */}
          {importError && (
            <div className="data-message data-error" data-testid="import-error">
              Import failed: {importError}
            </div>
          )}
          {importSuccess && (
            <div className="data-message data-success" data-testid="import-success">
              {importMigrated
                ? `Import successful! Migrated from version ${fromVersion} to version 12. Reloading...`
                : 'Import successful! Reloading...'}
            </div>
          )}

          {/* Reset Button */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Reset Local Data</span>
              <span className="setting-sublabel">
                Clear all progress, settings, and daily challenge results
              </span>
            </div>
            {!showResetConfirm ? (
              <button
                onClick={handleResetClick}
                className="action-button dangerous"
                data-testid="reset-save"
              >
                Reset
              </button>
            ) : (
              <div className="reset-confirm-wrapper" data-testid="reset-confirm">
                <button
                  onClick={handleResetConfirm}
                  className="action-button dangerous confirm"
                  data-testid="reset-confirm-yes"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={handleResetCancel}
                  className="action-button"
                  data-testid="reset-confirm-no"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Warning Message */}
          {showResetConfirm && (
            <div className="data-message data-warning" data-testid="reset-warning">
              ⚠️ This will permanently delete all your progress, settings, and daily challenge results. This cannot be undone!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}