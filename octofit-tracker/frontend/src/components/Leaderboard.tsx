import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { rank: number; teamName: string; totalPoints: number };
type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'success'; leaderboard: Entry[] };

export default function Leaderboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => { if (active) setState({ status: 'success', leaderboard }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <section><h2>Leaderboard</h2>
    {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {state.status === 'error' && <p role="alert">Unable to load leaderboard. Please try again.</p>}
    {state.status === 'success' && state.leaderboard.length === 0 && <p role="status">No leaderboard scores yet.</p>}
    {state.status === 'success' && state.leaderboard.length > 0 && <ol>{state.leaderboard.map((entry) => <li key={entry.teamName}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>}
  </section>;
}
