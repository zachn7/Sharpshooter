import { Link } from 'react-router-dom';

export function MainMenu() {
  return (
    <div className="main-menu" data-testid="main-menu">
      <div className="menu-content">
        <h2>Welcome to Sharpshooter</h2>
        <p>Select an option to begin:</p>
        <div className="menu-buttons">
          <Link to="/play" className="menu-button" data-testid="start-button">
            Start Game
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
      </div>
    </div>
  );
}
