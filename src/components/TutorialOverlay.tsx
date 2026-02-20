import { useState } from 'react';
import { hasTutorialBeenSeen, markTutorialSeen } from '../storage';

interface TutorialContent {
  title: string;
  message: string[];
}

// Tutorial content keyed by level ID
const TUTORIALS: Record<string, TutorialContent> = {
  'pistols-1-cqc': {
    title: 'Welcome to Pistols!',
    message: [
      'Pistols excel at close-range combat (25-50m).',
      'Higher velocity means less bullet drop than rifles...',
      '...but also more recoil that affects follow-up shots.',
      'Manage your shooting rhythm for consistent accuracy.',
    ],
  },
  'pistols-2-wind-adapt': {
    title: 'Pistol Wind Adaptation',
    message: [
      'Pistols have shorter flight time = less wind drift than rifles.',
      'At 25m, a 2.5 m/s crosswind causes ~3 MILs of drift.',
      'Hold slightly into the wind to compensate.',
      'Quick recovery: pistols return to stability faster than rifles!',
    ],
  },
  'pistols-3-rapid-fire': {
    title: 'Recoil Management',
    message: [
      'Rapid fire requires recoil awareness!',
      'Each shot raises the muzzle slightly - aim slightly lower.',
      'Pause briefly between shots to let the sight settle.',
      'Better weapons have faster recoil recovery times.',
    ],
  },
  'pistols-5-timed-string': {
    title: 'Timed Engagement',
    message: [
      'Plate targets: find each target and land hits quickly!',
      'You have 45 seconds to hit all 5 plates.',
      'Prioritize speed: 3 points per plate is generous.',
      'Focus on smooth transitions between targets!',
    ],
  },
  'rifle-basics-1': {
    title: 'Welcome to Sharpshooter!',
    message: [
      'Your first rifle shot - perfect conditions!',
      'Aim at the center of the target using your mouse.',
      'Click to fire when you\'re ready.',
      'You have 3 shots - make them count!',
    ],
  },
  'rifle-basics-2': {
    title: 'Reading Wind',
    message: [
      'Wind will push yourbullet sideways!',
      'Check the Wind HUD for current conditions.',
      'Positive wind (→) pushes shots RIGHT, aim LEFT to compensate.',
      'Negative wind (←) pushes shots LEFT, aim RIGHT to compensate.',
    ],
  },
  'rifle-basics-3': {
    title: 'Mil Reticle',
    message: [
      'Target is further now - use the MIL Reticle for precision!',
      'Toggle it with the "MIL Reticle" button.',
      'Each MIL at 75m = 7.5cm - perfect for precise aiming.',
      'Use magnification (1x/4x/8x) to see the reticle clearly.',
    ],
  },
  'rifle-basics-4': {
    title: 'Turret Dialing',
    message: [
      'Adjust your turret to compensate for bullet drop and wind.',
      'Elevation (+/-): Aim higher or lower.',
      'Windage (+/-): Aim left or right.',
      'Each click is 0.1 MIL at 75m = 7.5mm adjustment.',
    ],
  },
  'rifle-basics-5': {
    title: 'Return to Zero',
    message: [
      'Save your turret settings as a "Zero"!',
      'Click "Save Zero" after finding your perfect dial position.',
      'Use "Return to Zero" to restore it anytime.',
      'Great for quickly switching between different conditions.',
    ],
  },
  'shotgun-intro': {
    title: 'Welcome to Shotguns!',
    message: [
      'Shotguns fire multiple pellets in a spreading pattern.',
      'Hitting a target with ANY pellet scores points.',
      'Shot history shows how many pellets hit (🔫 symbol).',
      'Use this to your advantage on moving targets!',
    ],
  },
  'elr-intro': {
    title: 'Welcome to ELR!',
    message: [
      'Extended Long Range: layered wind, extreme environments, 600m+ shots.',
      'Watch the 3 flag indicators for wind in NEAR / MID / FAR segments.',
      'Wind changes as your bullet travels - adjust hold accordingly!',
      'Longer flight time = more bullet drop at each distance.',
      'Use higher magnification (4x/8x) to see the target clearly.',
      'ELR weapons have high velocity and low drag for extreme distances.',
    ],
  },
};

interface TutorialOverlayProps {
  levelId: string;
  onDismiss: () => void;
}

export function TutorialOverlay({ levelId, onDismiss }: TutorialOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const tutorial = TUTORIALS[levelId];
  // Initialize visibility lazily - show only if tutorial content exists and hasn't been seen
  const [isVisible, setIsVisible] = useState(() =>
    tutorial ? !hasTutorialBeenSeen(levelId) : false
  );

  const handleNext = () => {
    if (tutorial && currentIndex < tutorial.message.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    markTutorialSeen(levelId);
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible || !tutorial) {
    return null;
  }

  return (
    <div className="tutorial-overlay" data-testid="tutorial-overlay">
      <div className="tutorial-content">
        <div className="tutorial-header">
          <h2>{tutorial.title}</h2>
          <button
            onClick={handleDismiss}
            className="tutorial-close-button"
            data-testid="tutorial-close"
          >
            ✕
          </button>
        </div>
        <div className="tutorial-body">
          <p>{tutorial.message[currentIndex]}</p>
        </div>
        <div className="tutorial-footer">
          <span className="tutorial-progress">
            {currentIndex + 1} / {tutorial.message.length}
          </span>
          <button
            onClick={handleNext}
            className="tutorial-next-button"
            data-testid="tutorial-next"
          >
            {currentIndex < tutorial.message.length - 1 ? 'Next' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
}