export interface Session {
  date: string; // ISO date string
  pattern: string;
  durationMinutes: number;
  cycles: number;
}

export interface SessionStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
  hasSessionToday: boolean;
  recentSessions: Session[];
}

const KEYS = {
  lastSessionDate: "resonant-lastSessionDate",
  currentStreak: "resonant-currentStreak",
  longestStreak: "resonant-longestStreak",
  totalSessions: "resonant-totalSessions",
  totalMinutes: "resonant-totalMinutes",
  sessions: "resonant-sessions",
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const aDay = startOfDay(a).getTime();
  const bDay = startOfDay(b).getTime();
  return Math.round((bDay - aDay) / (1000 * 60 * 60 * 24));
}

function getInt(key: string): number {
  return parseInt(localStorage.getItem(key) || "0") || 0;
}

export function getSessionStats(): SessionStats {
  const currentStreak = getInt(KEYS.currentStreak);
  const longestStreak = getInt(KEYS.longestStreak);
  const totalSessions = getInt(KEYS.totalSessions);
  const totalMinutes = getInt(KEYS.totalMinutes);
  const lastDateStr = localStorage.getItem(KEYS.lastSessionDate);

  const today = startOfDay(new Date());
  let hasSessionToday = false;
  let validStreak = currentStreak;

  if (lastDateStr) {
    const lastDate = new Date(lastDateStr);
    const gap = daysBetween(lastDate, today);
    hasSessionToday = gap === 0;
    if (gap > 1) {
      // Streak broken
      validStreak = 0;
      localStorage.setItem(KEYS.currentStreak, "0");
    }
  }

  const sessions: Session[] = JSON.parse(
    localStorage.getItem(KEYS.sessions) || "[]"
  );

  return {
    currentStreak: validStreak,
    longestStreak,
    totalSessions,
    totalMinutes,
    hasSessionToday,
    recentSessions: sessions.slice(-20).reverse(),
  };
}

export function recordSession(
  pattern: string,
  durationMinutes: number,
  cycles: number
): SessionStats {
  const today = startOfDay(new Date());
  const lastDateStr = localStorage.getItem(KEYS.lastSessionDate);

  let currentStreak = getInt(KEYS.currentStreak);
  let longestStreak = getInt(KEYS.longestStreak);
  let totalSessions = getInt(KEYS.totalSessions);
  let totalMinutes = getInt(KEYS.totalMinutes);
  let hasSessionToday = false;

  totalMinutes += durationMinutes;

  if (lastDateStr) {
    const lastDate = new Date(lastDateStr);
    const gap = daysBetween(lastDate, today);

    if (gap === 0) {
      // Already have a session today — just add minutes
      hasSessionToday = true;
      totalSessions += 1;
    } else if (gap === 1) {
      // Continued streak from yesterday
      currentStreak += 1;
      totalSessions += 1;
      hasSessionToday = true;
    } else {
      // Streak broken, start fresh
      currentStreak = 1;
      totalSessions += 1;
      hasSessionToday = true;
    }
  } else {
    // First ever session
    currentStreak = 1;
    totalSessions += 1;
    hasSessionToday = true;
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Save stats
  localStorage.setItem(KEYS.currentStreak, String(currentStreak));
  localStorage.setItem(KEYS.longestStreak, String(longestStreak));
  localStorage.setItem(KEYS.totalSessions, String(totalSessions));
  localStorage.setItem(KEYS.totalMinutes, String(totalMinutes));
  localStorage.setItem(KEYS.lastSessionDate, today.toISOString());

  // Append to session log (keep last 100)
  const sessions: Session[] = JSON.parse(
    localStorage.getItem(KEYS.sessions) || "[]"
  );
  sessions.push({
    date: new Date().toISOString(),
    pattern,
    durationMinutes,
    cycles,
  });
  if (sessions.length > 100) sessions.splice(0, sessions.length - 100);
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));

  return {
    currentStreak,
    longestStreak,
    totalSessions,
    totalMinutes,
    hasSessionToday,
    recentSessions: sessions.slice(-20).reverse(),
  };
}
