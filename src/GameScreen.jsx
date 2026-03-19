import { useState, useEffect, useRef, useMemo } from 'react';

const BOX_WEIGHTS = [10, 4, 2, 1, 1];
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
  // Always exhaust never-seen characters before revisiting any seen card
  const unseen = pool.filter(c => !boxes.has(c.character) && c.character !== lastChar);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }
  // Edge case: only unseen card is the one just shown — show it anyway
  const unseenAny = pool.filter(c => !boxes.has(c.character));
  if (unseenAny.length > 0) return unseenAny[0];

  // All seen — weighted pick favouring lower boxes
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

export default function GameScreen({
  mode, activeGroups, threshold,
  elapsed, sessionDone,
  stats, setStats,
  boxes, setBoxes,
  onBack, onSessionFinish, onSessionContinue,
}) {
  const pool = useMemo(() => buildPool(activeGroups, mode), [activeGroups, mode]);

  // Local card state only — everything else lives in App
  const [current, setCurrent] = useState(() => weightedPick(pool, boxes, null));
  const [lastChar, setLastChar] = useState(null);
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
    advanceTimer.current = setTimeout(() => advance(nextBoxes, current.character), correct ? 600 : 1200);
  }

  function skip() {
    if (feedback || sessionDone) return;
    setFeedback({ text: `Answer: "${current.romaji[0]}"`, type: 'skip' });
    advanceTimer.current = setTimeout(() => advance(boxes, current.character), 1200);
  }

  return (
    <div className="game">
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
      <div className="game-content">
        <div className="flashcard">
          <div className="kana-display">{current.character}</div>
          <div className="kana-script-label">{current.type}</div>
          <div className="box-indicator">
            {[1,2,3,4,5].map(n => (
              <span key={n} className={`box-pip ${(boxes.get(current.character) ?? 1) >= n ? 'box-pip-on' : ''}`} />
            ))}
          </div>
        </div>

        <button className="listen-btn" onClick={() => speak(current.character)}>
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
