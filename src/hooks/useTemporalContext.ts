import { useState, useEffect, useCallback, useMemo } from "react";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface TemporalContext {
  timeOfDay: TimeOfDay;
  hour: number;
  isWeekend: boolean;
  greeting: string;
  lightingFilter: string;
  backgroundTheme: "warm" | "natural" | "cool" | "dark";
  ambientColor: string;
}

const TIME_RANGES: Record<TimeOfDay, { start: number; end: number }> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 21 },
  night: { start: 21, end: 6 },
};

const GREETINGS: Record<TimeOfDay, string[]> = {
  morning: ["Buongiorno!", "Buona giornata!", "Come stai stamattina?"],
  afternoon: ["Buon pomeriggio!", "Come procede la giornata?", "Ciao!"],
  evening: ["Buonasera!", "Come è andata la giornata?", "Che bella serata!"],
  night: ["Ehi, ancora sveglio?", "Buonanotte! Come stai?", "Notte tarda, eh?"],
};

const LIGHTING_FILTERS: Record<TimeOfDay, string> = {
  morning: "brightness(1.05) saturate(1.1) hue-rotate(-5deg)",
  afternoon: "brightness(1.0) saturate(1.0)",
  evening: "brightness(0.95) saturate(1.15) sepia(0.1) hue-rotate(10deg)",
  night: "brightness(0.85) saturate(0.9) hue-rotate(-10deg) contrast(1.05)",
};

const AMBIENT_COLORS: Record<TimeOfDay, string> = {
  morning: "rgba(255, 230, 200, 0.15)",
  afternoon: "rgba(255, 255, 255, 0)",
  evening: "rgba(255, 180, 100, 0.2)",
  night: "rgba(80, 100, 200, 0.15)",
};

const BACKGROUND_THEMES: Record<TimeOfDay, TemporalContext["backgroundTheme"]> = {
  morning: "warm",
  afternoon: "natural",
  evening: "warm",
  night: "dark",
};

export function useTemporalContext() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getTimeOfDay = useCallback((hour: number): TimeOfDay => {
    if (hour >= TIME_RANGES.morning.start && hour < TIME_RANGES.morning.end) return "morning";
    if (hour >= TIME_RANGES.afternoon.start && hour < TIME_RANGES.afternoon.end) return "afternoon";
    if (hour >= TIME_RANGES.evening.start && hour < TIME_RANGES.evening.end) return "evening";
    return "night";
  }, []);

  const temporalContext = useMemo((): TemporalContext => {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    const timeOfDay = getTimeOfDay(hour);
    const greetings = GREETINGS[timeOfDay];

    return {
      timeOfDay,
      hour,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      greeting: greetings[Math.floor(Math.random() * greetings.length)],
      lightingFilter: LIGHTING_FILTERS[timeOfDay],
      backgroundTheme: BACKGROUND_THEMES[timeOfDay],
      ambientColor: AMBIENT_COLORS[timeOfDay],
    };
  }, [currentTime, getTimeOfDay]);

  return temporalContext;
}
