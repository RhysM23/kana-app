import { useState, useEffect, useRef } from 'react';
import SetupScreen from './SetupScreen';
import GameScreen from './GameScreen';
import MobileGameScreen from './MobileGameScreen';
import WritingGameScreen from './WritingGameScreen';
import './App.css';

export default function App() {
  const [gameConfig, setGameConfig] = useState(null);
  const [sessionGoal, setSessionGoal] = useState(30 * 60);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Session state — persists across sub-sessions
  const [elapsed, setElapsed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
  const [boxes, setBoxes] = useState(() => new Map());

  const clockRef = useRef(null);
  const inactivityRef = useRef(null);

  function stopClock() {
    clearInterval(clockRef.current);
    clockRef.current = null;
  }

  function startClock(goal) {
    if (clockRef.current) return;
    const target = goal ?? sessionGoal;
    clockRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= target) {
          stopClock();
          setSessionDone(true);
          return target;
        }
        return e + 1;
      });
    }, 1000);
  }

  // Pause after 30s of inactivity; resume on interaction
  function resetInactivityTimer() {
    clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => stopClock(), 30_000);
  }

  function handleActivity() {
    if (!gameConfig || sessionDone) return;
    if (!clockRef.current) startClock();
    resetInactivityTimer();
  }

  useEffect(() => {
    return () => {
      stopClock();
      clearTimeout(inactivityRef.current);
    };
  }, []);

  function handleStart(config) {
    const goal = config.duration * 60;
    setSessionGoal(goal);
    startClock(goal);
    resetInactivityTimer();
    setGameConfig(config);
  }

  function handleBack() {
    stopClock(); // pause while in menu
    clearTimeout(inactivityRef.current);
    setGameConfig(null);
  }

  function handleSessionFinish() {
    stopClock();
    clearTimeout(inactivityRef.current);
    setElapsed(0);
    setSessionDone(false);
    setStats({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
    setBoxes(new Map());
    setGameConfig(null);
  }

  function handleSessionContinue() {
    setSessionDone(false);
    startClock();
    resetInactivityTimer();
  }

  function handleResetBoxes() {
    setBoxes(new Map());
  }

  const GameComponent = gameConfig?.quizType === 'writing'
    ? WritingGameScreen
    : isMobile ? MobileGameScreen : GameScreen;

  return gameConfig ? (
    <GameComponent
      mode={gameConfig.mode}
      activeGroups={gameConfig.activeGroups}
      threshold={gameConfig.threshold}
      sessionGoal={sessionGoal}
      elapsed={elapsed}
      sessionDone={sessionDone}
      stats={stats}
      setStats={setStats}
      boxes={boxes}
      setBoxes={setBoxes}
      onBack={handleBack}
      onSessionFinish={handleSessionFinish}
      onSessionContinue={handleSessionContinue}
      onActivity={handleActivity}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  ) : (
    <SetupScreen
      onStart={handleStart}
      elapsed={elapsed}
      sessionActive={elapsed > 0 && !sessionDone}
      sessionDone={sessionDone}
      hasProgress={boxes.size > 0}
      onResetBoxes={handleResetBoxes}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}
