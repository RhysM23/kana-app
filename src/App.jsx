import { useState, useEffect, useRef } from 'react';
import SetupScreen from './SetupScreen';
import GameScreen from './GameScreen';
import './App.css';

const SESSION_GOAL = 30 * 60;

export default function App() {
  const [gameConfig, setGameConfig] = useState(null);

  // Session state — persists across sub-sessions
  const [elapsed, setElapsed] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
  const [boxes, setBoxes] = useState(() => new Map());

  const clockRef = useRef(null);

  function startClock() {
    if (clockRef.current) return; // already running
    clockRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= SESSION_GOAL) {
          clearInterval(clockRef.current);
          clockRef.current = null;
          setSessionDone(true);
          return SESSION_GOAL;
        }
        return e + 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearInterval(clockRef.current), []);

  function handleStart(config) {
    startClock();
    setGameConfig(config);
  }

  function handleBack() {
    setGameConfig(null); // clock keeps running
  }

  function handleSessionFinish() {
    // Reset everything for a new session
    clearInterval(clockRef.current);
    clockRef.current = null;
    setElapsed(0);
    setSessionDone(false);
    setStats({ correct: 0, wrong: 0, streak: 0, bestStreak: 0 });
    setBoxes(new Map());
    setGameConfig(null);
  }

  function handleSessionContinue() {
    setSessionDone(false);
    startClock();
  }

  return gameConfig ? (
    <GameScreen
      mode={gameConfig.mode}
      activeGroups={gameConfig.activeGroups}
      threshold={gameConfig.threshold}
      elapsed={elapsed}
      sessionDone={sessionDone}
      stats={stats}
      setStats={setStats}
      boxes={boxes}
      setBoxes={setBoxes}
      onBack={handleBack}
      onSessionFinish={handleSessionFinish}
      onSessionContinue={handleSessionContinue}
    />
  ) : (
    <SetupScreen
      onStart={handleStart}
      elapsed={elapsed}
      sessionActive={elapsed > 0 && !sessionDone}
      sessionDone={sessionDone}
    />
  );
}
