import { useState, useEffect, useRef, useMemo } from 'react';

const BOX_WEIGHTS = [10, 4, 2, 1, 1];

function buildPool(activeWordGroups) {
  const pool = [];
  for (const group of activeWordGroups) {
    for (const word of group.words) {
      pool.push({ kana: word.kana, romaji: word.romaji, meaning: word.meaning });
    }
  }
  return pool;
}

function weightedPick(pool, boxes, lastKana) {
  const unseen = pool.filter(w => !boxes.has(w.kana) && w.kana !== lastKana);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }
  const unseenAny = pool.filter(w => !boxes.has(w.kana));
  if (unseenAny.length > 0) return unseenAny[0];

  const weights = pool.map(w => BOX_WEIGHTS[(boxes.get(w.kana) ?? 1) - 1]);
  const total = weights.reduce((a, b) => a + b, 0);

  for (let attempt = 0; attempt < (pool.length > 1 ? 10 : 1); attempt++) {
    let rand = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        if (pool.length === 1 || pool[i].kana !== lastKana) return pool[i];
        break;
      }
    }
  }
  return pool.find(w => w.kana !== lastKana) || pool[0];
}

function speak(kana) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(kana);
  u.lang = 'ja-JP';
  window.speechSynthesis.speak(u);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function WordGameScreen({
  activeWordGroups, threshold, sessionGoal,
  elapsed, sessionDone,
  stats, setStats,
  boxes, setBoxes,
  onBack, onSessionFinish, onSessionContinue, onActivity,
  theme, toggleTheme,
}) {
  const pool = useMemo(() => buildPool(activeWordGroups), [activeWordGroups]);

  const [current, setCurrent] = useState(() => weightedPick(pool, boxes, null));
  const [lastKana, setLastKana] = useState(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);

  const inputRef = useRef(null);
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    if (!feedback && !sessionDone) inputRef.current?.focus();
  }, [current, feedback, sessionDone]);

  const accuracy = stats.correct + stats.wrong === 0
    ? null
    : Math.round(stats.correct / (stats.correct + stats.wrong) * 100);
  const passed = accuracy !== null && accuracy >= threshold;
  const timeProgress = Math.min(elapsed / sessionGoal, 1);

  function advance(nextBoxes, nextLastKana) {
    const next = weightedPick(pool, nextBoxes, nextLastKana);
    setCurrent(next);
    setLastKana(nextLastKana);
    setInput('');
    setFeedback(null);
  }

  function submit() {
    if (feedback || sessionDone) return;
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    onActivity?.();

    const correct = current.romaji.includes(trimmed);
    const curBox = boxes.get(current.kana) ?? 1;
    const nextBoxes = new Map(boxes);

    if (correct) {
      nextBoxes.set(current.kana, Math.min(5, curBox + 1));
      setStats(s => ({
        correct: s.correct + 1,
        wrong: s.wrong,
        streak: s.streak + 1,
        bestStreak: Math.max(s.bestStreak, s.streak + 1),
      }));
      setFeedback({ text: '✓ Correct!', type: 'correct' });
    } else {
      nextBoxes.set(current.kana, 1);
      setStats(s => ({ ...s, wrong: s.wrong + 1, streak: 0 }));
      setFeedback({ text: `✗ "${current.romaji[0]}"`, type: 'wrong' });
    }

    setBoxes(nextBoxes);
    advanceTimer.current = setTimeout(() => advance(nextBoxes, current.kana), correct ? 600 : 1200);
  }

  function skip() {
    if (feedback || sessionDone) return;
    onActivity?.();
    setFeedback({ text: `"${current.romaji[0]}"`, type: 'skip' });
    advanceTimer.current = setTimeout(() => advance(boxes, current.kana), 1200);
  }

  return (
    <div className="game">
      {/* Stats bar */}
      <div className="stats-bar">
        <button className="back-btn" onClick={onBack} title="Back to menu">←</button>
        <div className="timer" style={{ color: elapsed >= sessionGoal ? 'var(--correct)' : 'var(--text)' }}>
          {formatTime(elapsed)}
          <span className="timer-goal">/ {formatTime(sessionGoal)}</span>
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
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>

      {/* Time progress bar */}
      <div className="time-progress-track">
        <div
          className="time-progress-fill"
          style={{
            width: `${timeProgress * 100}%`,
            background: elapsed >= sessionGoal ? 'var(--correct)' : 'var(--accent)',
          }}
        />
      </div>

      {/* Game content */}
      <div className="game-content">
        <div className="flashcard word-flashcard">
          <div className="word-kana-display">{current.kana}</div>
          <div className="word-meaning">{current.meaning}</div>
          <div className="box-indicator">
            {[1, 2, 3, 4, 5].map(n => {
              const lvl = boxes.get(current.kana) ?? 1;
              return (
                <span key={n} className={`box-pip ${lvl >= n ? (lvl === 5 ? 'box-pip-mastered' : 'box-pip-on') : ''}`} />
              );
            })}
          </div>
        </div>

        <button className="listen-btn" onClick={() => speak(current.kana)}>
          🔊 Listen
        </button>

        <div className="input-row">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Type romaji..."
            disabled={!!feedback || sessionDone}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="submit-btn" onClick={submit} disabled={!!feedback || sessionDone}>
            Submit
          </button>
        </div>

        {!feedback && !sessionDone && (
          <button className="skip-btn" onClick={skip}>Skip</button>
        )}

        {feedback && !sessionDone && (
          <div className={`feedback feedback-${feedback.type}`}>{feedback.text}</div>
        )}
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
