import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MainMenu } from './pages/MainMenu';
import { Weapons } from './pages/Weapons';
import { Levels } from './pages/Levels';
import { Settings } from './pages/Settings';
import { Game } from './pages/Game';
import { ZeroRange } from './pages/ZeroRange';
import { DailyChallenge } from './pages/DailyChallenge';
import { Drills } from './pages/Drills';

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
  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  );
}

export default App;
