import { useState, useEffect, useRef, useMemo } from 'react';
import { buildProgressionGroups } from './progression';
import './MobileGameScreen.css';

const NEEDED = 3; // consecutive-correct answers to master a character

function speak(character) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(character);
  u.lang = 'ja-JP';
  window.speechSynthesis.speak(u);
}

// Weighted pick within a group. Unmastered cards dominate; mastered cards still
// surface occasionally ("keep mixing until the group is done"). Avoids immediate
// repeats when possible. Returns null when every card in the group is mastered.
function pickNext(cards, counts, lastChar) {
  const remaining = cards.filter(c => (counts.get(c.character) ?? 0) < NEEDED);
  if (remaining.length === 0) return null;

  const weightOf = c => {
    const n = counts.get(c.character) ?? 0;
    return n >= NEEDED ? 1 : (NEEDED - n) * 5;
  };
  const total = cards.reduce((sum, c) => sum + weightOf(c), 0);

  for (let attempt = 0; attempt < (cards.length > 1 ? 12 : 1); attempt++) {
    let rand = Math.random() * total;
    for (const c of cards) {
      rand -= weightOf(c);
      if (rand <= 0) {
        if (cards.length === 1 || c.character !== lastChar) return c;
        break;
      }
    }
  }
  return remaining.find(c => c.character !== lastChar) || remaining[0];
}

// Deterministic shuffle seeded from a string, so it's pure (no Math.random in
// render) yet scrambles the tracker order away from the canonical a-i-u-e-o.
function seededShuffle(arr, seedStr) {
  let state = 0;
  for (let i = 0; i < seedStr.length; i++) state = (state * 31 + seedStr.charCodeAt(i)) | 0;
  state = state || 1;
  const rand = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const KB_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export default function ProgressionGameScreen({
  quizType, mode, activeGroups, isMobile,
  stats, setStats,
  onBack, onSessionFinish,
  theme, toggleTheme,
}) {
  const groups = useMemo(
    () => buildProgressionGroups(quizType, mode, activeGroups),
    [quizType, mode, activeGroups],
  );

  const [groupIndex, setGroupIndex] = useState(0);
  const [counts, setCounts] = useState(() => new Map()); // character -> consecutive correct, current group only
  const [current, setCurrent] = useState(() => pickNext(groups[0]?.cards ?? [], new Map(), null));
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [phase, setPhase] = useState('playing'); // 'playing' | 'cleared' | 'done'

  const inputRef = useRef(null);
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    if (!isMobile && phase === 'playing' && !feedback) inputRef.current?.focus();
  }, [current, feedback, phase, isMobile]);

  const group = groups[groupIndex];
  const cards = group?.cards ?? [];
  const masteredInGroup = cards.filter(c => (counts.get(c.character) ?? 0) >= NEEDED).length;

  // Tracker display order is shuffled per group so the chip positions don't map
  // to a memorised sequence (e.g. a-i-u-e-o) — otherwise you could read the
  // answer off the tracker instead of recognising the kana.
  const trackerOrder = useMemo(
    () => seededShuffle(group?.cards ?? [], group?.id ?? ''),
    [group],
  );
  const groupsCleared = groupIndex; // groups fully behind us
  const overallProgress = groups.length ? groupsCleared / groups.length : 0;
  const nextGroup = groups[groupIndex + 1];

  function advanceCard(nextCounts) {
    const next = pickNext(cards, nextCounts, current?.character ?? null);
    if (next === null) {
      // Group complete.
      if (groupIndex + 1 >= groups.length) {
        setPhase('done');
      } else {
        setPhase('cleared');
      }
      return;
    }
    setCurrent(next);
    setInput('');
    setFeedback(null);
  }

  function submit() {
    if (feedback || phase !== 'playing') return;
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    const correct = current.romaji.includes(trimmed);
    const nextCounts = new Map(counts);

    if (correct) {
      const n = Math.min(NEEDED, (counts.get(current.character) ?? 0) + 1);
      nextCounts.set(current.character, n);
      setStats(s => ({
        correct: s.correct + 1,
        wrong: s.wrong,
        streak: s.streak + 1,
        bestStreak: Math.max(s.bestStreak, s.streak + 1),
      }));
      setFeedback({ text: '✓ Correct!', type: 'correct' });
    } else {
      nextCounts.set(current.character, 0); // consecutive streak resets
      setStats(s => ({ ...s, wrong: s.wrong + 1, streak: 0 }));
      setFeedback({ text: `✗ It's "${current.romaji[0]}"`, type: 'wrong' });
    }

    setCounts(nextCounts);
    advanceTimer.current = setTimeout(() => advanceCard(nextCounts), correct ? 600 : 1200);
  }

  function skip() {
    if (feedback || phase !== 'playing') return;
    setFeedback({ text: `Answer: "${current.romaji[0]}"`, type: 'skip' });
    advanceTimer.current = setTimeout(() => advanceCard(counts), 1200);
  }

  function continueToNextGroup() {
    const nextCounts = new Map();
    const nextIndex = groupIndex + 1;
    setGroupIndex(nextIndex);
    setCounts(nextCounts);
    setInput('');
    setFeedback(null);
    setPhase('playing');
    setCurrent(pickNext(groups[nextIndex].cards, nextCounts, null));
  }

  function handleKey(key) {
    if (feedback || phase !== 'playing') return;
    navigator.vibrate?.(18);
    setInput(prev => prev + key);
  }

  function handleBackspace() {
    if (feedback || phase !== 'playing') return;
    navigator.vibrate?.(10);
    setInput(prev => prev.slice(0, -1));
  }

  const curCount = counts.get(current?.character) ?? 0;
  const modeLabel = quizType === 'lookalikes' ? 'Look-alikes' : 'Ladder';

  const header = (
    <>
      <div className="stats-bar">
        <button className="back-btn" onClick={onBack} title="Back to menu">←</button>
        <div className="prog-group-info">
          <span className="prog-group-label">{group?.label}</span>
          <span className="prog-group-sub">
            {modeLabel} · Group {groupIndex + 1}/{groups.length}
          </span>
        </div>
        <div className="prog-mastered">
          {masteredInGroup}/{cards.length} ✓
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
      <div className="time-progress-track">
        <div
          className="time-progress-fill"
          style={{ width: `${overallProgress * 100}%`, background: 'var(--accent)' }}
        />
      </div>
    </>
  );

  const groupTracker = (
    <div className="prog-tracker">
      {trackerOrder.map(c => {
        const mastered = (counts.get(c.character) ?? 0) >= NEEDED;
        return (
          <span key={c.character} className={`prog-chip ${mastered ? 'prog-chip-mastered' : ''}`}>
            {c.character}
          </span>
        );
      })}
    </div>
  );

  const flashcard = (
    <div className={isMobile ? 'mobile-flashcard' : 'flashcard'}>
      <div className="kana-display">{current?.character}</div>
      <div className="kana-script-label">{current?.type}</div>
      <div className="box-indicator">
        {Array.from({ length: NEEDED }, (_, i) => (
          <span
            key={i}
            className={`box-pip ${curCount > i ? (curCount >= NEEDED ? 'box-pip-mastered' : 'box-pip-on') : ''}`}
          />
        ))}
      </div>
    </div>
  );

  const overlay = (phase === 'cleared' || phase === 'done') && (
    <div className="session-overlay">
      <div className="session-card">
        {phase === 'cleared' ? (
          <>
            <div className="session-icon">✅</div>
            <h2 className="session-title">{group?.label} cleared!</h2>
            <div className="session-goal-label">
              {nextGroup ? `Up next: ${nextGroup.label}` : ''}
            </div>
            <div className="prog-overall-label">
              {groupIndex + 1} of {groups.length} groups done
            </div>
            <div className="session-actions">
              <button className="session-btn-primary" onClick={continueToNextGroup}>
                Next group →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="session-icon">🎉</div>
            <h2 className="session-title">All groups mastered!</h2>
            <div className="session-goal-label">
              {groups.length} groups · {modeLabel}
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
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── Mobile layout: on-screen keyboard ──
  if (isMobile) {
    return (
      <div className="mobile-game">
        {header}
        <div className="mobile-game-content">
          {groupTracker}
          {flashcard}
          <button className="listen-btn" onClick={() => speak(current?.character)}>
            🔊 Listen
          </button>
          <div className={`mobile-input-display ${feedback ? `mobile-input-${feedback.type}` : ''}`}>
            <span className="mobile-input-text">
              {input || <span className="mobile-input-placeholder">type romaji…</span>}
            </span>
            {!feedback && phase === 'playing' && <span className="mobile-input-cursor" />}
          </div>
          {feedback && (
            <div className={`feedback feedback-${feedback.type}`}>{feedback.text}</div>
          )}
        </div>

        <div className="mobile-keyboard">
          {KB_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="kb-row">
              {row.map(key => (
                <button
                  key={key}
                  className="kb-key"
                  onPointerDown={e => { e.preventDefault(); handleKey(key); }}
                  disabled={!!feedback || phase !== 'playing'}
                >
                  {key}
                </button>
              ))}
              {rowIdx === 2 && (
                <button
                  className="kb-key kb-backspace"
                  onPointerDown={e => { e.preventDefault(); handleBackspace(); }}
                  disabled={!!feedback || phase !== 'playing'}
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
              disabled={!!feedback || phase !== 'playing'}
            >
              Skip
            </button>
            <button
              className="kb-action-btn kb-submit-btn"
              onPointerDown={e => { e.preventDefault(); submit(); }}
              disabled={!!feedback || phase !== 'playing' || !input.trim()}
            >
              Submit ↵
            </button>
          </div>
        </div>

        {overlay}
      </div>
    );
  }

  // ── Desktop layout: native input ──
  return (
    <div className="game">
      {header}
      <div className="game-content">
        {groupTracker}
        {flashcard}
        <button className="listen-btn" onClick={() => speak(current?.character)}>
          🔊 Listen
        </button>
        <div className="input-row">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Type romaji..."
            disabled={!!feedback || phase !== 'playing'}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="submit-btn" onClick={submit} disabled={!!feedback || phase !== 'playing'}>
            Submit
          </button>
        </div>
        {!feedback && phase === 'playing' && (
          <button className="skip-btn" onClick={skip}>Skip</button>
        )}
        {feedback && (
          <div className={`feedback feedback-${feedback.type}`}>{feedback.text}</div>
        )}
      </div>
      {overlay}
    </div>
  );
}
