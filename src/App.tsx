import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { getGameSettings } from './storage/localStore';
import { MainMenu } from './pages/MainMenu';
import { Weapons } from './pages/Weapons';
import { Levels } from './pages/Levels';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';
import { Achievements } from './pages/Achievements';
import { Game } from './pages/Game';
import { ZeroRange } from './pages/ZeroRange';
import { DailyChallenge } from './pages/DailyChallenge';
import { Drills } from './pages/Drills';
import { Academy } from './pages/Academy';
import { Contracts } from './pages/Contracts';
import { ContractSummary } from './pages/ContractSummary';

// Tutorial route redirect component
// Redirects /tutorial/:id to /game/:id with query params preserved and tutorialId added
function TutorialRedirect() {
  const { tutorialId } = useParams();
  const location = useLocation();
  
  // Build new search params with tutorialId added
  const newSearchParams = new URLSearchParams(location.search);
  newSearchParams.set('tutorialId', tutorialId || '');
  
  // Preserve all query params (testMode, seed, dateOverride, etc.) and add tutorialId
  const to = { pathname: `/game/${tutorialId}`, search: newSearchParams.toString() };
  
  return <Navigate to={to} replace />;
}

function InnerApp() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout showBackButton={false}>
            <MainMenu />
          </Layout>
        }
      />
      {/* Tutorial route alias - redirects to game with proper params */}
      <Route
        path="/tutorial/:tutorialId"
        element={<TutorialRedirect />}
      />
      {/* Legacy route: /play redirects to /levels */}
      <Route
        path="/play"
        element={<Navigate to="/levels" replace state={{ notice: "Select a level to start" }} />}
      />
      {/* Guard: /game without levelId redirects to /levels */}
      <Route
        path="/game"
        element={<Navigate to="/levels" replace state={{ notice: "Select a level to start" }} />}
      />
      <Route
        path="/academy"
        element={
          <Layout>
            <Academy />
          </Layout>
        }
      />
      <Route
        path="/weapons"
        element={
          <Layout>
            <Weapons />
          </Layout>
        }
      />
      <Route
        path="/levels"
        element={
          <Layout>
            <Levels />
          </Layout>
        }
      />
      <Route
        path="/settings"
        element={
          <Layout>
            <Settings />
          </Layout>
        }
      />
      <Route
        path="/daily"
        element={
          <Layout>
            <DailyChallenge />
          </Layout>
        }
      />
      <Route
        path="/drills"
        element={
          <Layout>
            <Drills />
          </Layout>
        }
      />
      <Route
        path="/contracts"
        element={
          <Layout>
            <Contracts />
          </Layout>
        }
      />
      <Route
        path="/contract-summary"
        element={
          <Layout>
            <ContractSummary />
          </Layout>
        }
      />
      <Route
        path="/stats"
        element={
          <Layout>
            <Stats />
          </Layout>
        }
      />
      <Route
        path="/achievements"
        element={
          <Layout>
            <Achievements />
          </Layout>
        }
      />
      <Route path="/game/:levelId" element={<Game />} />
      <Route
        path="/zero"
        element={
          <Layout>
            <ZeroRange />
          </Layout>
        }
      />
    </Routes>
  );
}

function App() {
  // Apply reduced motion class based on settings and system preference
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    const applyReducedMotion = () => {
      const settings = getGameSettings();
      const systemPrefersReduced = window.matchMedia('(prefers-reduced-motion: reduced)').matches;
      
      if (settings.vfx.reducedMotion || systemPrefersReduced) {
        root.classList.add('reduced-motion');
      } else {
        root.classList.remove('reduced-motion');
      }
    };

    // Apply initially and listen for settings/changes
    applyReducedMotion();
    
    // Listen for system changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduced)');
    mediaQuery.addEventListener('change', applyReducedMotion);
    
    // Listen for storage changes (settings updates)
    const handleStorageChange = () => {
      applyReducedMotion();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('game-settings-changed', handleStorageChange);
    
    return () => {
      mediaQuery.removeEventListener('change', applyReducedMotion);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('game-settings-changed', handleStorageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  );
}

export default App;
