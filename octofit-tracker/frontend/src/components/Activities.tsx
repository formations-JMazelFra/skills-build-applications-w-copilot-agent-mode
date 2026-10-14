import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'success'; activities: Activity[] };

export default function Activities() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => { if (active) setState({ status: 'success', activities }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <section><h2>Activities</h2>
    {state.status === 'loading' && <p role="status">Loading activities...</p>}
    {state.status === 'error' && <p role="alert">Unable to load activities. Please try again.</p>}
    {state.status === 'success' && state.activities.length === 0 && <p role="status">No activities yet.</p>}
    {state.status === 'success' && state.activities.length > 0 && <ul>{state.activities.map((activity, index) => <li key={`${activity.type}-${index}`}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>)}</ul>}
  </section>;
}
