import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Glossary } from '../components/Glossary';

export function MainMenu() {
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <div className="main-menu" data-testid="main-menu">
      <div className="menu-content">
        <h2>Welcome to Sharpshooter</h2>
        <p>Select an option to begin:</p>
        <div className="menu-buttons">
          <Link to="/play" className="menu-button" data-testid="start-button">
            Start Game
          </Link>
          <Link to="/academy" className="menu-button" data-testid="academy-button">
            Tutorial Academy
          </Link>
          <Link to="/daily" className="menu-button" data-testid="daily-button">
            Daily Challenge
          </Link>
          <Link to="/drills" className="menu-button" data-testid="drills-button">
            Training Drills
          </Link>
          <Link to="/stats" className="menu-button" data-testid="stats-button">
            Stats
          </Link>
          <Link to="/achievements" className="menu-button" data-testid="achievements-button">
            Achievements
          </Link>
          <Link to="/weapons" className="menu-button" data-testid="weapons-button">
            Weapons
          </Link>
          <Link to="/levels" className="menu-button" data-testid="levels-button">
            Levels
          </Link>
          <Link to="/settings" className="menu-button" data-testid="settings-button">
            Settings
          </Link>
          </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => setShowGlossary(true)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              backgroundColor: '#0f3460',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            📚 Help & Glossary
          </button>
        </div>
      </div>

      {/* Glossary overlay */}
      {showGlossary && (
        <Glossary onClose={() => setShowGlossary(false)} />
      )}
    </div>
  );
}
