import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity details are required', 400);
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw httpError('Valid userId and teamId are required', 400);
  if (typeof type !== 'string' || !type.trim()) throw httpError('Activity type is required', 400);
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError('Minutes must be a positive number', 400);
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw httpError('The selected user or team does not exist', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team details are required', 400);
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw httpError('Team name is required', 400);
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError('Team mascot is required', 400);
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw httpError('Members must be an array of valid user IDs', 400);
  }

  const uniqueMembers = [...new Set(members)];
  const memberCount = await User.countDocuments({ _id: { $in: uniqueMembers } });
  if (memberCount !== uniqueMembers.length) throw httpError('One or more team members do not exist', 404);

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMembers });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError('No user was found for this email address', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const activityFocus = (type: string) => {
    const normalized = type.toLowerCase();
    if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking'].includes(normalized)) return 'endurance';
    return normalized;
  };
  const recentTypes = activities.map(({ type }) => type.toLowerCase());
  const recentFocuses = new Set(activities.map(({ type }) => activityFocus(type)));

  return workouts
    .map((workout, index) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goal;
      const matchesActivity = recentFocuses.has(focus) || recentTypes.includes(focus);
      return {
        ...workout,
        reason: matchesGoal
          ? `Matches your ${user.fitnessGoal} fitness goal.`
          : matchesActivity
            ? `Builds on your recent ${recentTypes.find((type) => activityFocus(type) === focus || type === focus)} activity.`
            : `Supports your ${user.fitnessGoal} fitness goal.`,
        score: Number(matchesGoal) * 2 + Number(matchesActivity),
        index,
      };
    })
    .sort((first, second) => second.score - first.score || first.index - second.index)
    .map(({ score: _score, index: _index, ...suggestion }) => suggestion);
}

export { User };
