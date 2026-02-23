import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  GraduationCap, 
  Calendar, 
  Dumbbell, 
  BarChart3, 
  Trophy, 
  Crosshair,
  Layers,
  Settings,
  BookOpen
} from 'lucide-react';
import { Glossary } from '../components/Glossary';

interface MenuItemProps {
  to: string;
  testId: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isPrimary?: boolean;
}

function MenuItem({ to, testId, icon, title, description, isPrimary = false }: MenuItemProps) {
  return (
    <Link
      to={to}
      className={`menu-card ${isPrimary ? 'menu-card-primary' : ''}`}
      data-testid={testId}
    >
      <div className="menu-card-icon">{icon}</div>
      <div className="menu-card-content">
        <h3 className="menu-card-title">{title}</h3>
        <p className="menu-card-description">{description}</p>
      </div>
      <div className="menu-card-arrow">→</div>
    </Link>
  );
}

export function MainMenu() {
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <div className="main-menu page-transition" data-testid="main-menu">
      <div className="menu-container">
        {/* Header */}
        <header className="menu-header">
          <div className="menu-title">
            <Target className="menu-title-icon" size={48} />
            <h1>Sharpshooter</h1>
          </div>
          <p className="menu-subtitle">
            Master long-range ballistics with realistic physics simulations
          </p>
        </header>

        {/* Main Actions */}
        <div className="menu-primary-actions">
          <MenuItem
            to="/play"
            testId="start-button"
            icon={<Crosshair size={24} />}
            title="Start Game"
            description="Jump into action with your unlocked weapons"
            isPrimary
          />
        </div>

        {/* Secondary Actions */}
        <section className="menu-section">
          <h2 className="menu-section-title">Training</h2>
          <div className="menu-grid">
            <MenuItem
              to="/academy"
              testId="academy-button"
              icon={<GraduationCap size={24} />}
              title="Tutorial Academy"
              description="Learn fundamentals with guided lessons"
            />
            <MenuItem
              to="/drills"
              testId="drills-button"
              icon={<Dumbbell size={24} />}
              title="Training Drills"
              description="Practice specific skills challenges"
            />
            <MenuItem
              to="/daily"
              testId="daily-button"
              icon={<Calendar size={24} />}
              title="Daily Challenge"
              description="Compete for the best score today"
            />
          </div>
        </section>

        {/* Progress & Gear */}
        <section className="menu-section">
          <h2 className="menu-section-title">Progress & Gear</h2>
          <div className="menu-grid">
            <MenuItem
              to="/stats"
              testId="stats-button"
              icon={<BarChart3 size={24} />}
              title="Statistics"
              description="View your performance metrics"
            />
            <MenuItem
              to="/achievements"
              testId="achievements-button"
              icon={<Trophy size={24} />}
              title="Achievements"
              description="Track your accomplishments"
            />
            <MenuItem
              to="/weapons"
              testId="weapons-button"
              icon={<Layers size={24} />}
              title="Weapons"
              description="Manage your arsenal and loadout"
            />
            <MenuItem
              to="/levels"
              testId="levels-button"
              icon={<Crosshair size={24} />}
              title="Levels"
              description="Progress through missions"
            />
          </div>
        </section>

        {/* Settings */}
        <section className="menu-section">
          <MenuItem
            to="/settings"
            testId="settings-button"
            icon={<Settings size={24} />}
            title="Settings"
            description="Customize your experience"
          />
        </section>

        {/* Help Button */}
        <div className="menu-footer">
          <button
            onClick={() => setShowGlossary(true)}
            className="menu-help-button"
            data-testid="help-button"
          >
            <BookOpen size={18} />
            Help & Glossary
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