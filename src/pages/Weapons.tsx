import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getWeaponsByType, type WeaponType } from '../data/weapons';
import { setSelectedWeapon, getSelectedWeaponId } from '../storage';

export function Weapons() {
  const [activeTab, setActiveTab] = useState<WeaponType>('pistol');
  const [selectedWeaponId, setSelectedWeaponIdState] = useState(() => getSelectedWeaponId());

  const weaponTypes: Array<{ id: WeaponType; label: string }> = [
    { id: 'pistol', label: 'Pistols' },
    { id: 'rifle', label: 'Rifles' },
    { id: 'sniper', label: 'Snipers' },
    { id: 'shotgun', label: 'Shotguns' },
  ];

  const handleWeaponSelect = (weaponId: string) => {
    setSelectedWeaponIdState(weaponId);
    setSelectedWeapon(weaponId);
  };

  const currentWeapons = getWeaponsByType(activeTab);

  return (
    <div className="weapons-page" data-testid="weapons-page">
      <div className="page-header">
        <Link to="/" className="back-button" data-testid="back-button">
          ← Back
        </Link>
        <h2>Weapons</h2>
      </div>
      
      <div className="weapon-tabs">
        {weaponTypes.map((type) => (
          <button
            key={type.id}
            className={`tab-button ${activeTab === type.id ? 'active' : ''}`}
            onClick={() => setActiveTab(type.id)}
            data-testid={`tab-${type.id}`}
          >
            {type.label}
          </button>
        ))}
      </div>
      
      <div className="weapon-grid" data-testid="weapon-content">
        {currentWeapons.map((weapon) => (
          <div
            key={weapon.id}
            className={`weapon-card ${selectedWeaponId === weapon.id ? 'selected' : ''} ${!weapon.unlocked ? 'locked' : ''}`}
            data-testid={`weapon-${weapon.id}`}
            onClick={() => weapon.unlocked && handleWeaponSelect(weapon.id)}
          >
            <div className="weapon-header">
              <h3 className="weapon-name">{weapon.name}</h3>
              {!weapon.unlocked && <span className="locked-badge">🔒</span>}
              {selectedWeaponId === weapon.id && weapon.unlocked && (
                <span className="selected-badge">✓</span>
              )}
            </div>
            <p className="weapon-description">{weapon.description}</p>
            {weapon.unlocked && (
              <div className="weapon-stats">
                <div className="stat-row">
                  <span className="stat-label">Velocity:</span>
                  <span className="stat-value">{weapon.params.muzzleVelocityMps} m/s</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Accuracy:</span>
                  <span className="stat-value">
                    {weapon.params.dragFactor < 0.00002 ? 'High' : weapon.params.dragFactor < 0.00003 ? 'Medium' : 'Low'}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Default Optic:</span>
                  <span className="stat-value">{formatOpticType(weapon.params.defaultOptic)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {currentWeapons.length === 0 && (
        <div className="empty-state">
          <p>No weapons available in this category.</p>
        </div>
      )}
    </div>
  );
}

function formatOpticType(optic: string): string {
  const map: Record<string, string> = {
    'iron-sights': 'Iron Sights',
    'red-dot': 'Red Dot',
    'scope-4x': '4x Scope',
    'scope-8x': '8x Scope',
    'scope-12x': '12x Scope',
  };
  return map[optic] || optic;
}
