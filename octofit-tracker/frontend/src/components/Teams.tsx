import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'success'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => { if (active) setState({ status: 'success', teams }); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, []);

  return <section><h2>Teams</h2>
    {state.status === 'loading' && <p role="status">Loading teams...</p>}
    {state.status === 'error' && <p role="alert">Unable to load teams. Please try again.</p>}
    {state.status === 'success' && state.teams.length === 0 && <p role="status">No teams yet.</p>}
    {state.status === 'success' && state.teams.length > 0 && <ul>{state.teams.map((team, index) => <li key={team._id ?? team.name ?? index}>{team.name} ({team.mascot}) - {team.members.length} members</li>)}</ul>}
  </section>;
}
