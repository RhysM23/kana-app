import { useState, useEffect, useRef, useMemo } from 'react';

const BOX_WEIGHTS = [10, 4, 2, 1, 1];

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
  const unseen = pool.filter(c => !boxes.has(c.character) && c.character !== lastChar);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }
  const unseenAny = pool.filter(c => !boxes.has(c.character));
  if (unseenAny.length > 0) return unseenAny[0];

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

export default function WritingGameScreen({
  mode, activeGroups, threshold, sessionGoal,
  elapsed, sessionDone,
  stats, setStats,
  boxes, setBoxes,
  onBack, onSessionFinish, onSessionContinue, onActivity,
  theme, toggleTheme,
}) {
  const pool = useMemo(() => buildPool(activeGroups, mode), [activeGroups, mode]);

  const [current, setCurrent] = useState(() => weightedPick(pool, boxes, null));
  const [lastChar, setLastChar] = useState(null);
  const [phase, setPhase] = useState('drawing'); // 'drawing' | 'revealed'

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const hasDrawn = useRef(false);
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Resize canvas to its CSS size on mount and when card changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    setupCtx(ctx);
  }, [current]);

  function setupCtx(ctx) {
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--text').trim() || '#000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left),
      y: (src.clientY - rect.top),
    };
  }

  function onPointerDown(e) {
    if (phase === 'revealed') return;
    e.preventDefault();
    onActivity?.();
    isDrawing.current = true;
    hasDrawn.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    const ctx = canvasRef.current.getContext('2d');
    setupCtx(ctx);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function onPointerMove(e) {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    setupCtx(ctx);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function onPointerUp() {
    isDrawing.current = false;
    lastPos.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    hasDrawn.current = false;
  }

  function reveal() {
    onActivity?.();
    setPhase('revealed');
  }

  function score(correct) {
    onActivity?.();
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
    } else {
      nextBoxes.set(current.character, 1);
      setStats(s => ({ ...s, wrong: s.wrong + 1, streak: 0 }));
    }

    setBoxes(nextBoxes);
    advanceTimer.current = setTimeout(() => {
      const next = weightedPick(pool, nextBoxes, current.character);
      setCurrent(next);
      setLastChar(current.character);
      setPhase('drawing');
      hasDrawn.current = false;
    }, 400);
  }

  function skip() {
    onActivity?.();
    setPhase('revealed');
  }

  const accuracy = stats.correct + stats.wrong === 0
    ? null
    : Math.round(stats.correct / (stats.correct + stats.wrong) * 100);
  const passed = accuracy !== null && accuracy >= threshold;
  const timeProgress = Math.min(elapsed / sessionGoal, 1);

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
        {/* Prompt card: shows romaji */}
        <div className="writing-prompt-row">
          <div className="flashcard writing-prompt-card">
            <div className="writing-romaji-display">{current.romaji[0]}</div>
            <div className="kana-script-label">{current.type}</div>
            <div className="box-indicator">
              {[1, 2, 3, 4, 5].map(n => {
                const lvl = boxes.get(current.character) ?? 1;
                return (
                  <span key={n} className={`box-pip ${lvl >= n ? (lvl === 5 ? 'box-pip-mastered' : 'box-pip-on') : ''}`} />
                );
              })}
            </div>
          </div>

          {/* Answer: hidden until revealed */}
          <div className={`flashcard writing-answer-card ${phase === 'revealed' ? 'writing-answer-visible' : 'writing-answer-hidden'}`}>
            {phase === 'revealed' ? (
              <>
                <div className="kana-display">{current.character}</div>
                <button className="listen-btn writing-listen-btn" onClick={() => speak(current.character)}>
                  🔊
                </button>
              </>
            ) : (
              <div className="writing-answer-placeholder">?</div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="writing-canvas"
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          />
          <button className="canvas-clear-btn" onClick={clearCanvas} title="Clear">✕</button>
        </div>

        {/* Actions */}
        {phase === 'drawing' && !sessionDone && (
          <div className="writing-actions">
            <button className="skip-btn" onClick={skip}>Skip</button>
            <button className="submit-btn" onClick={reveal}>Reveal</button>
          </div>
        )}

        {phase === 'revealed' && !sessionDone && (
          <div className="writing-actions">
            <button className="writing-wrong-btn" onClick={() => score(false)}>✗ Missed it</button>
            <button className="writing-correct-btn" onClick={() => score(true)}>✓ Got it</button>
          </div>
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
