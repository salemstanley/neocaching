import { useEffect, useRef, useState } from 'react';

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A countdown that ends the game once, either by winning or by running out.
export function useCountdown(seconds: number, onDone: (won: boolean) => void, running = true) {
  const [left, setLeft] = useState(seconds);
  const finished = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const finish = (won: boolean) => {
    if (finished.current) return;
    finished.current = true;
    doneRef.current(won);
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && left <= 0) finish(false);
  }, [left, running]);

  return { left, finish, finished };
}
