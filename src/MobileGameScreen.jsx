import { useState, useEffect, useRef, useMemo } from 'react';
import './MobileGameScreen.css';

const BOX_WEIGHTS = [5, 4, 3, 2, 1];
const SESSION_GOAL = 30 * 60;

function buildPool(activeGroups, mode) {
  const pool = [];
  for (const group of activeGroups) {
    for (const char of group.grid) {
      if (!char) continue;
      if (mode === 'hiragana' || mode === 'both') {
        pool.push({ character: char.h, romaji: char.r, type: 'hiragana' });
      }
      if (mode === 'katakana' || mode === 'both') {
        pool.push({ character: char.k, romaji: char.r, type: 'katakana' });
      }
    }
  }
  return pool;
}

function weightedPick(pool, boxes, lastChar) {
  const weights = pool.map(c => BOX_WEIGHTS[(boxes.get(c.character) ?? 1) - 1]);
  const total = weights.reduce((a, b) => a + b, 0);
  for (let attempt = 0; attempt < (pool.length > 1 ? 10 : 1); attempt++) {
    let rand = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        if (pool.length === 1 || pool[i].character !== lastChar) return pool[i];
        break;
      }
    }
  }
  return pool.find(c => c.character !== lastChar) || pool[0];
}

function speak(character) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(character);
  u.lang = 'ja-JP';
  window.speechSynthesis.speak(u);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const KB_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export default function MobileGameScreen({
  mode, activeGroups, threshold,
  elapsed, sessionDone,
  stats, setStats,
  boxes, setBoxes,
  onBack, onSessionFinish, onSessionContinue,
}) {
  const pool = useMemo(() => buildPool(activeGroups, mode), [activeGroups, mode]);

  const [current, setCurrent] = useState(() => weightedPick(pool, boxes, null));
  const [lastChar, setLastChar] = useState(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  const advanceTimer = useRef(null);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const accuracy = stats.correct + stats.wrong === 0
    ? null
    : Math.round(stats.correct / (stats.correct + stats.wrong) * 100);

  const passed = accuracy !== null && accuracy >= threshold;
  const timeProgress = Math.min(elapsed / SESSION_GOAL, 1);

  function advance(nextBoxes, nextLastChar) {
    const next = weightedPick(pool, nextBoxes, nextLastChar);
    setCurrent(next);
    setLastChar(nextLastChar);
    setInput('');
    setFeedback(null);
  }

  function submit() {
    if (feedback || sessionDone) return;
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    const correct = current.romaji.includes(trimmed);
    const curBox = boxes.get(current.character) ?? 1;
    const nextBoxes = new Map(boxes);

    if (correct) {
      nextBoxes.set(current.character, Math.min(5, curBox + 1));
      setStats(s => ({
        correct: s.correct + 1,
        wrong: s.wrong,
        streak: s.streak + 1,
        bestStreak: Math.max(s.bestStreak, s.streak + 1),
      }));
      setFeedback({ text: '✓ Correct!', type: 'correct' });
    } else {
      nextBoxes.set(current.character, 1);
      setStats(s => ({ ...s, wrong: s.wrong + 1, streak: 0 }));
      setFeedback({ text: `✗ It's "${current.romaji[0]}"`, type: 'wrong' });
    }

    setBoxes(nextBoxes);
    advanceTimer.current = setTimeout(
      () => advance(nextBoxes, current.character),
      correct ? 600 : 1200
    );
  }

  function skip() {
    if (feedback || sessionDone) return;
    setFeedback({ text: `Answer: "${current.romaji[0]}"`, type: 'skip' });
    advanceTimer.current = setTimeout(() => advance(boxes, current.character), 1200);
  }

  function handleKey(key) {
    if (feedback || sessionDone) return;
    setInput(prev => prev + key);
  }

  function handleBackspace() {
    if (feedback || sessionDone) return;
    setInput(prev => prev.slice(0, -1));
  }

  return (
    <div className="mobile-game">
      {/* Stats bar */}
      <div className="stats-bar">
        <button className="back-btn" onClick={onBack} title="Back to menu">←</button>
        <div className="timer" style={{ color: elapsed >= SESSION_GOAL ? 'var(--correct)' : 'var(--text)' }}>
          {formatTime(elapsed)}
          <span className="timer-goal">/ 30:00</span>
        </div>
        <div className="stats">
          {accuracy !== null && (
            <span className="stat-accuracy" style={{ color: passed ? 'var(--correct)' : 'var(--wrong)' }}>
              {accuracy}%
            </span>
          )}
          <span className="stat-correct">✓ {stats.correct}</span>
          <span className="stat-wrong">✗ {stats.wrong}</span>
          <span className="stat-streak">🔥 {stats.streak}</span>
        </div>
      </div>

      {/* Time progress bar */}
      <div className="time-progress-track">
        <div
          className="time-progress-fill"
          style={{
            width: `${timeProgress * 100}%`,
            background: elapsed >= SESSION_GOAL ? 'var(--correct)' : 'var(--accent)',
          }}
        />
      </div>

      {/* Game content */}
      <div className="mobile-game-content">
        <div className="mobile-flashcard">
          <div className="kana-display">{current.character}</div>
          <div className="kana-script-label">{current.type}</div>
          <div className="box-indicator">
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                className={`box-pip ${(boxes.get(current.character) ?? 1) >= n ? 'box-pip-on' : ''}`}
              />
            ))}
          </div>
        </div>

        <button className="listen-btn" onClick={() => speak(current.character)}>
          🔊 Listen
        </button>

        {/* Input display — no native input, so no popup keyboard */}
        <div className={`mobile-input-display ${feedback ? `mobile-input-${feedback.type}` : ''}`}>
          <span className="mobile-input-text">{input || <span className="mobile-input-placeholder">type romaji…</span>}</span>
          {!feedback && !sessionDone && <span className="mobile-input-cursor" />}
        </div>

        {feedback && !sessionDone && (
          <div className={`feedback feedback-${feedback.type}`}>{feedback.text}</div>
        )}
      </div>

      {/* Built-in keyboard */}
      <div className="mobile-keyboard">
        {KB_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="kb-row">
            {row.map(key => (
              <button
                key={key}
                className="kb-key"
                onPointerDown={e => { e.preventDefault(); handleKey(key); }}
                disabled={!!feedback || sessionDone}
              >
                {key}
              </button>
            ))}
            {rowIdx === 2 && (
              <button
                className="kb-key kb-backspace"
                onPointerDown={e => { e.preventDefault(); handleBackspace(); }}
                disabled={!!feedback || sessionDone}
              >
                ⌫
              </button>
            )}
          </div>
        ))}
        <div className="kb-row kb-row-actions">
          <button
            className="kb-action-btn kb-skip-btn"
            onPointerDown={e => { e.preventDefault(); skip(); }}
            disabled={!!feedback || sessionDone}
          >
            Skip
          </button>
          <button
            className="kb-action-btn kb-submit-btn"
            onPointerDown={e => { e.preventDefault(); submit(); }}
            disabled={!!feedback || sessionDone || !input.trim()}
          >
            Submit ↵
          </button>
        </div>
      </div>

      {/* Session complete overlay */}
      {sessionDone && (
        <div className="session-overlay">
          <div className="session-card">
            <div className="session-icon">{passed ? '🎉' : '📚'}</div>
            <h2 className="session-title">Session Complete</h2>

            <div className="session-accuracy" style={{ color: passed ? 'var(--correct)' : 'var(--wrong)' }}>
              {accuracy ?? 0}%
            </div>
            <div className="session-goal-label">
              {passed ? `Goal of ${threshold}% reached!` : `Goal was ${threshold}% — keep going`}
            </div>

            <div className="session-stats-grid">
              <div className="session-stat">
                <span className="session-stat-value" style={{ color: 'var(--correct)' }}>{stats.correct}</span>
                <span className="session-stat-label">Correct</span>
              </div>
              <div className="session-stat">
                <span className="session-stat-value" style={{ color: 'var(--wrong)' }}>{stats.wrong}</span>
                <span className="session-stat-label">Wrong</span>
              </div>
              <div className="session-stat">
                <span className="session-stat-value" style={{ color: 'var(--streak)' }}>{stats.bestStreak}</span>
                <span className="session-stat-label">Best streak</span>
              </div>
              <div className="session-stat">
                <span className="session-stat-value">{stats.correct + stats.wrong}</span>
                <span className="session-stat-label">Total</span>
              </div>
            </div>

            <div className="session-actions">
              <button className="session-btn-primary" onClick={onSessionFinish}>Finish</button>
              <button className="session-btn-secondary" onClick={onSessionContinue}>Keep going</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
