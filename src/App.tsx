import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MainMenu } from './pages/MainMenu';
import { Weapons } from './pages/Weapons';
import { Levels } from './pages/Levels';
import { Settings } from './pages/Settings';
import { Game } from './pages/Game';

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
      <Route path="/play" element={<Game />} />
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
