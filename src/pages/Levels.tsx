interface LevelPack {
  id: string;
  name: string;
  weaponType: string;
  levelCount: number;
}

const levelPacks: LevelPack[] = [
  { id: 'pistol-basics', name: 'Pistol Basics', weaponType: 'pistols', levelCount: 5 },
  { id: 'rifle-mastery', name: 'Rifle Mastery', weaponType: 'rifles', levelCount: 8 },
  { id: 'shotgun-training', name: 'Shotgun Training', weaponType: 'shotguns', levelCount: 6 },
  { id: 'smg-precision', name: 'SMG Precision', weaponType: 'smg', levelCount: 7 },
];

export function Levels() {
  return (
    <div className="levels-page" data-testid="levels-page">
      <h2>Levels</h2>
      <p>Select a level pack to play:</p>
      <div className="level-packs">
        {levelPacks.map((pack) => (
          <div key={pack.id} className="level-pack" data-testid={`level-pack-${pack.id}`}>
            <h3>{pack.name}</h3>
            <p>Weapon: {pack.weaponType}</p>
            <p>Levels: {pack.levelCount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
