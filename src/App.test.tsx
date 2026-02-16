import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MainMenu } from './pages/MainMenu';
import { Weapons } from './pages/Weapons';
import { Levels } from './pages/Levels';
import { Settings } from './pages/Settings';
import { Game } from './pages/Game';
import { clearSaveData } from './storage';

describe('App Pages', () => {
  beforeEach(() => {
    clearSaveData();
  });

  describe('MainMenu', () => {
    it('renders navigation buttons', () => {
      render(
        <BrowserRouter>
          <MainMenu />
        </BrowserRouter>
      );
      expect(screen.getByTestId('main-menu')).toBeInTheDocument();
      expect(screen.getByTestId('start-button')).toBeInTheDocument();
      expect(screen.getByTestId('weapons-button')).toBeInTheDocument();
      expect(screen.getByTestId('levels-button')).toBeInTheDocument();
      expect(screen.getByTestId('settings-button')).toBeInTheDocument();
    });
  });

  describe('Weapons', () => {
    it('renders weapon tabs and content', () => {
      render(
        <BrowserRouter>
          <Weapons />
        </BrowserRouter>
      );
      expect(screen.getByTestId('weapons-page')).toBeInTheDocument();
      expect(screen.getByTestId('tab-pistol')).toBeInTheDocument();
      expect(screen.getByTestId('weapon-content')).toBeInTheDocument();
    });

    it('switches tabs when clicking', async () => {
      render(
        <BrowserRouter>
          <Weapons />
        </BrowserRouter>
      );
      const riflesTab = screen.getByTestId('tab-rifle');
      await userEvent.click(riflesTab);
      expect(riflesTab).toHaveClass('active');
    });
  });

  describe('Levels', () => {
    it('renders level packs', () => {
      render(
        <BrowserRouter>
          <Levels />
        </BrowserRouter>
      );
      expect(screen.getByTestId('levels-page')).toBeInTheDocument();
      expect(screen.getByTestId('level-pack-pistol-basics')).toBeInTheDocument();
      expect(screen.getByTestId('level-pack-sniper-basics')).toBeInTheDocument();
    });
  });

  describe('Settings', () => {
    it('renders setting toggles and preset', () => {
      render(
        <BrowserRouter>
          <Settings />
        </BrowserRouter>
      );
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-show-hud')).toBeInTheDocument();
      expect(screen.getByTestId('realism-preset')).toBeInTheDocument();
    });
  });

  describe('Game', () => {
    it('renders game canvas', () => {
      render(
        <BrowserRouter>
          <Game />
        </BrowserRouter>
      );
      expect(screen.getByTestId('game-page')).toBeInTheDocument();
      expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
    });
  });
});
