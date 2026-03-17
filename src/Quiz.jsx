import { useState, useEffect, useRef } from 'react';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Quiz({ deck }) {
  const [queue, setQueue] = useState(() => shuffle(deck));
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const inputRef = useRef(null);

  useEffect(() => {
    setQueue(shuffle(deck));
    setCurrent(0);
    setInput('');
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
  }, [deck]);

  useEffect(() => {
    if (feedback === null) inputRef.current?.focus();
  }, [feedback, current]);

  const card = queue[current];

  function submit(e) {
    e.preventDefault();
    if (feedback !== null) return;
    const correct = input.trim().toLowerCase() === card.romaji;
    setFeedback(correct ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setInput('');
    setFeedback(null);
    setCurrent(c => {
      if (c + 1 >= queue.length) {
        setQueue(shuffle(deck));
        return 0;
      }
      return c + 1;
    });
  }

  return (
    <div className="quiz">
      <div className="score">{score.correct} / {score.total}</div>
      <div className="card">{card.kana}</div>
      <form onSubmit={submit}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="romaji..."
          disabled={feedback !== null}
          autoComplete="off"
        />
        {feedback === null && <button type="submit">Check</button>}
      </form>
      {feedback === 'correct' && (
        <div className="feedback correct">
          Correct! <button onClick={next}>Next</button>
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="feedback wrong">
          Wrong — answer: <strong>{card.romaji}</strong> <button onClick={next}>Next</button>
        </div>
      )}
    </div>
  );
}
