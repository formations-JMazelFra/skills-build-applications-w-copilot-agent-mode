import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'success'; suggestions: Workout[] };
const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`)
      .then(({ suggestions }) => { if (active) setState({ status: 'success', suggestions }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <section><h2>Workout suggestions</h2>
    {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {state.status === 'error' && <p role="alert">Unable to load workout suggestions. Please try again.</p>}
    {state.status === 'success' && state.suggestions.length === 0 && <p role="status">No workout suggestions yet.</p>}
    {state.status === 'success' && state.suggestions.length > 0 && <ul>{state.suggestions.map((workout) => <li key={workout.title}><h3>{workout.title}</h3><p>{workout.focus} - {workout.minutes} minutes - {workout.difficulty}</p><p>{workout.reason}</p></li>)}</ul>}
  </section>;
}
