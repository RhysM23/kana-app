import { useState, useMemo } from 'react';
import { kanaGroups, BASIC_GROUP_IDS, VOICED_GROUP_IDS } from './kana';

const COLS = ['a', 'i', 'u', 'e', 'o'];

const basicGroups = kanaGroups.filter(g => BASIC_GROUP_IDS.includes(g.id));
const voicedGroups = kanaGroups.filter(g => VOICED_GROUP_IDS.includes(g.id));

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function SetupScreen({ onStart, elapsed = 0, sessionActive = false, sessionDone = false, hasProgress = false, onResetBoxes, theme, toggleTheme }) {
  const [mode, setMode] = useState('hiragana');
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [tableScript, setTableScript] = useState('hiragana');
  const [threshold, setThreshold] = useState(80);
  const [duration, setDuration] = useState(30);

  function toggleGroup(id) {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const charCount = useMemo(() => {
    let count = 0;
    for (const group of kanaGroups) {
      if (!selectedGroups.has(group.id)) continue;
      const nonNull = group.grid.filter(Boolean).length;
      count += mode === 'both' ? nonNull * 2 : nonNull;
    }
    return count;
  }, [selectedGroups, mode]);

  function start() {
    onStart({
      mode,
      threshold,
      duration,
      activeGroups: kanaGroups.filter(g => selectedGroups.has(g.id)),
    });
  }

  return (
    <div className="setup">
      <div className="setup-header">
        <h1 className="setup-title">Kana Quiz</h1>
        {(sessionActive || sessionDone) && (
          <div className={`setup-timer ${sessionDone ? 'setup-timer-done' : ''}`}>
            {sessionDone ? '✓ ' : ''}{formatTime(elapsed)}
          </div>
        )}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="segment-control">
        {['hiragana', 'katakana', 'both'].map(m => (
          <button
            key={m}
            className={mode === m ? 'active' : ''}
            onClick={() => setMode(m)}
          >
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Group chips */}
      <div className="chip-section">
        <div className="chip-group-label">Basic</div>
        <div className="chips">
          {basicGroups.map(g => (
            <button
              key={g.id}
              className={`chip ${selectedGroups.has(g.id) ? 'chip-on' : ''}`}
              onClick={() => toggleGroup(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="chip-group-label" style={{ marginTop: '0.5rem' }}>Voiced</div>
        <div className="chips">
          {voicedGroups.map(g => (
            <button
              key={g.id}
              className={`chip ${selectedGroups.has(g.id) ? 'chip-on' : ''}`}
              onClick={() => toggleGroup(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accuracy goal */}
      <div className="chip-section">
        <div className="chip-group-label">Accuracy goal</div>
        <div className="chips">
          {[70, 75, 80, 85, 90].map(t => (
            <button
              key={t}
              className={`chip ${threshold === t ? 'chip-on' : ''}`}
              onClick={() => setThreshold(t)}
            >
              {t}%
            </button>
          ))}
        </div>
      </div>

      {/* Session duration */}
      <div className="chip-section">
        <div className="chip-group-label">Session length</div>
        <div className="chips">
          {[5, 10, 15, 20, 30, 45, 60].map(d => (
            <button
              key={d}
              className={`chip ${duration === d ? 'chip-on' : ''}`}
              onClick={() => setDuration(d)}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      {/* Character count */}
      <p className="char-count">{charCount} characters selected</p>

      {/* Reference table */}
      <div className="reference">
        <div className="table-toggle">
          {['hiragana', 'katakana'].map(s => (
            <button
              key={s}
              className={tableScript === s ? 'active' : ''}
              onClick={() => setTableScript(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="table-wrapper">
          <table className="kana-table">
            <thead>
              <tr>
                <th className="row-head"></th>
                {COLS.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {kanaGroups.map(group => (
                <tr key={group.id} className={group.voiced ? 'voiced-row' : ''}>
                  <td className="row-head">{group.label}</td>
                  {group.grid.map((char, i) => (
                    <td key={i} className="kana-cell">
                      {char && (
                        <span className="kana-cell-char" title={char.r.join(' / ')}>
                          {tableScript === 'hiragana' ? char.h : char.k}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start */}
      <button className="start-btn" disabled={charCount === 0} onClick={start}>
        {charCount === 0 ? 'Select groups to start' : `Start — ${charCount} characters`}
      </button>

      {hasProgress && (
        <button className="reset-btn" onClick={onResetBoxes}>
          Reset weightings
        </button>
      )}
    </div>
  );
}
