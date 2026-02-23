/**
 * Glossary entries for in-game terms.
 * All explanations are framed as game mechanics, not real-world guidance.
 */

export interface GlossaryEntry {
  id: string;
  term: string;
  shortDescription: string;
  description: string;
  category: string;
}

export const GLOSSARY_CATEGORIES = [
  'Basics',
  'Controls',
  'Environment',
  'Ballistics',
  'Advanced',
] as const;

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: 'range',
    term: 'Range / Distance',
    shortDescription: 'How far the target is from you',
    description:
      'Distance to target in meters. Shots travel slower at longer distances and are affected more by wind and gravity. Closer targets are easier because your projectile hits them faster with less drop.',
    category: 'Basics',
  },
  {
    id: 'wind',
    term: 'Wind',
    shortDescription: 'Pushes your shot sideways',
    description:
      'Wind speed and direction shown in m/s (meters per second). Crosswind pushes your projectile left or right. Read the wind using flags: faster flag flutter = higher wind. Use the wind arrows onscreen to see wind direction.',
    category: 'Basics',
  },
  {
    id: 'mils',
    term: 'MILs',
    shortDescription: 'Unit of angular measurement for scopes',
    description:
      'MILs (milliradians) are like scope ruler marks. 1 MIL is about 3.6 inches at 100 meters. Use your reticle dots to measure target size or hold-off for wind and bullet drop. Larger numbers = farther away or hold-off needed.',
    category: 'Basics',
  },
  {
    id: 'clicks',
    term: 'Turret Clicks',
    shortDescription: 'Adjust your scope sights',
    description:
      'One turret click changes your aim point. Each click moves your point of impact by a specific amount (usually 0.25 or 0.1 MILs). Use elevation clicks to compensate for bullet drop (aiming up), and windage clicks to compensate for wind (aiming left/right).',
    category: 'Controls',
  },
  {
    id: 'zero',
    term: 'Zeroing / Zero Profile',
    shortDescription: 'Set your scope to hit where you aim',
    description:
      'Your zero profile stores turret adjustments so your shots hit the bullseye at a specific distance. Adjust turrets until shots land on center at your zero distance, then save the profile. Use different zeros for different weapons.',
    category: 'Controls',
  },
  {
    id: 'drag',
    term: 'Bullet Drop / Drag',
    shortDescription: 'Projectile slows down over distance',
    description:
      'Projectiles slow down and fall over distance due to air resistance (drag). At longer ranges, you must aim higher to compensate for bullet drop. The range card shows how much drop to expect at your current distance.',
    category: 'Ballistics',
  },
  {
    id: 'environment',
    term: 'Environment',
    category: 'Environment',
    shortDescription: 'Temperature and altitude affect shots',
    description:
      'Hotter air and higher altitude reduce air density, making shots fly faster with less drop. Colder, denser air slows shots and increases drop. The environment HUD shows current temperature (°C) and altitude (m).',
  },
  {
    id: 'dispersion',
    term: 'Dispersion / Precision',
    shortDescription: 'How consistent your shots are',
    description:
      'Dispersion is how much your shots spread from one another. Smaller group size = higher precision. Better weapons and ammo have higher precision (lower dispersion). Your aimpoint stays the same, but shots may land slightly different due to precision limits.',
    category: 'Ballistics',
  },
  {
    id: 'reticle',
    term: 'Reticle',
    shortDescription: 'Scope crosshair pattern',
    description:
      'The pattern of lines and dots in your scope. Common styles: MIL-Dot (dots at 1 MIL spacing), Simple (just crosshair). Use reticle to measure target size in MILs and hold-off for wind. Toggle reticle modes in the game HUD.',
    category: 'Controls',
  },
  {
    id: 'magnification',
    term: 'Magnification',
    shortDescription: 'Scope zoom level',
    description:
      'How much your scope zooms in (1x, 4x, 8x, 12x). Higher magnification makes targets appear closer and larger onscreen. Use lower mag for closer targets, higher mag for distant ones. Toggle mag settings in game HUD.',
    category: 'Controls',
  },
  {
    id: 'sway',
    term: 'Sway / Stability',
    category: 'Controls',
    shortDescription: 'Natural weapon movement',
    description:
      'Your weapon moves naturally due to breathing and muscle tension. Higher sway = more movement. Press and hold to steady your aim (reduce sway) before firing. Each weapon has different stability characteristics.',
  },
  {
    id: 'recoil',
    term: 'Recoil',
    shortDescription: 'Kick when firing',
    description:
      'Weapon kick-back when firing affects how fast you can fire accurately. Recoil recovery time varies by weapon - shotguns have more recoil than pistols. Wait for recoil to settle before firing the next shot for best accuracy.',
    category: 'Advanced',
  },
  {
    id: 'air-density',
    term: 'Air Density',
    shortDescription: 'How heavy the air is',
    description:
      'Air density affects how your projectile flies. Shown in kg/m³. Denser air (higher value) slows shots more and increases drop. Lower air density (at altitude, hot weather) makes shots fly farther with less drop. Expert mode shows this value.',
    category: 'Environment',
  },
  {
    id: 'wind-layers',
    term: 'Wind Layers',
    shortDescription: 'Different wind at different distances',
    description:
      'In advanced levels, wind changes at different distances. You may see near/mid/far wind segments with different speeds. Read all wind indicators to account for layered wind. Flags at each distance show the wind there.',
    category: 'Advanced',
  },
  {
    id: 'coriolis',
    term: 'Coriolis Effect',
    shortDescription: 'Earth rotation affects long shots',
    description:
      'At very long distances (600m+), Earth rotation causes tiny shot deflection. Higher latitude and longer range increase the effect. This is an advanced feature only visible in Expert Challenge levels. Small adjustments needed at extreme ranges.',
    category: 'Advanced',
  },
  {
    id: 'pellet-spread',
    term: 'Pellet Spread (Shotguns)',
    shortDescription: 'Shotgun pellets spread out',
    description:
      'Shotguns fire multiple pellets (usually 12) that spread out. Closer targets get hit by more pellets (higher score). At farther distances, pellets spread wider and may miss plate targets entirely. Lead moving targets to account for pellet travel time.',
    category: 'Advanced',
  },
];

export function getGlossarySearchResults(query: string): GlossaryEntry[] {
  const lowerQuery = query.toLowerCase();
  return GLOSSARY_ENTRIES.filter(
    (entry) =>
      entry.term.toLowerCase().includes(lowerQuery) ||
      entry.shortDescription.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery),
  );
}

export function getGlossaryEntryById(id: string): GlossaryEntry | undefined {
  return GLOSSARY_ENTRIES.find((entry) => entry.id === id);
}
