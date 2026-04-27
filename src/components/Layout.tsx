import { Link, useLocation } from 'react-router-dom';
import { ProfileRankBar } from './ProfileRankBar';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

export function Layout({ children, showBackButton = true }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          {showBackButton && location.pathname !== '/' && (
            <Link to="/" className="back-button" data-testid="back-button">
              ← Back
            </Link>
          )}
          <h1 className="app-title">Sharpshooter</h1>
          <ProfileRankBar compact className="app-header-rank" />
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
