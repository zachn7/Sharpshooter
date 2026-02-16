import { useState } from 'react';

export function Weapons() {
  const [activeTab, setActiveTab] = useState('pistols');

  const weaponTypes = [
    { id: 'pistols', label: 'Pistols' },
    { id: 'rifles', label: 'Rifles' },
    { id: 'shotguns', label: 'Shotguns' },
    { id: 'smg', label: 'SMGs' },
  ];

  return (
    <div className="weapons-page" data-testid="weapons-page">
      <h2>Weapons</h2>
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
      <div className="weapon-content" data-testid="weapon-content">
        <p>{weaponTypes.find((t) => t.id === activeTab)?.label} weapons coming soon...</p>
      </div>
    </div>
  );
}
