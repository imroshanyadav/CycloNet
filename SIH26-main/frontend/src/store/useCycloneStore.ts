import { create } from "zustand";
import { BASIN_CENTERS, CYCLONES } from "../data/cyclones";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export function getHistoricalCenter(
  replayData: any,
  classifications: any,
  index: number,
): { lat: number; lon: number } | null {
  const step = replayData?.steps?.[index];
  if (!step) return null;

  const targetTime = Date.parse(step.time);
  let nearestCenter: { lat: number; lon: number } | null = null;
  let nearestDifference = Infinity;

  for (const replayStep of replayData.steps) {
    for (const actual of Object.values(replayStep.actual ?? {}) as any[]) {
      const actualTime = Date.parse(actual?.valid_time);
      if (!actual?.center || !Number.isFinite(actualTime)) continue;

      const difference = Math.abs(actualTime - targetTime);
      if (difference < nearestDifference) {
        nearestDifference = difference;
        nearestCenter = actual.center;
      }
    }
  }

  if (nearestCenter) return nearestCenter;

  const classification =
    classifications?.find((item: any) => item.timestamp === step.time) ||
    classifications?.[index];
  return classification?.center ?? null;
}

export interface LiveData {
  status: "LIVE" | "UPDATING" | "STALE" | "OFFLINE";
  lastUpdated: string | null;
  atmosphere: {
    windSpeed: number | null;
    windDirection: number | null;
    pressure: number | null;
    humidity: number | null;
    rainfall: number | null;
  };
  ocean: {
    sst: number | null;
    currentVelocity: number | null;
    currentDirection: number | null;
    waveHeight: number | null;
  };
  cyclone: { active: boolean };
}

interface CycloneState {
  mode: "LIVE" | "HISTORICAL";
  liveBasin: "Bay of Bengal" | "Arabian Sea";
  activeEventId: string;
  timelineIndex: number;
  isPlaying: boolean;
  introComplete: boolean;
  liveData: LiveData;
  evidenceOpen: boolean;

  // API Data
  apiReplayData: any | null;
  apiMetricsData: any | null;
  apiClassificationsData: any | null;
  isLoadingData: boolean;

  // Actions
  setMode: (mode: "LIVE" | "HISTORICAL") => void;
  setLiveBasin: (basin: "Bay of Bengal" | "Arabian Sea") => void;
  setActiveCyclone: (cycloneId: string) => void;
  setTimelineIndex: (index: number) => void;
  togglePlay: () => void;
  setIntroComplete: (complete: boolean) => void;
  fetchLiveData: () => Promise<void>;
  openEvidence: () => void;
  closeEvidence: () => void;
  fetchEventData: (eventId: string) => Promise<void>;

  // Derived helpers
  getCurrentObservation: () => any;
}

const DEFAULT_LIVE_DATA: LiveData = {
  status: "UPDATING",
  lastUpdated: null,
  atmosphere: {
    windSpeed: null,
    windDirection: null,
    pressure: null,
    humidity: null,
    rainfall: null,
  },
  ocean: {
    sst: null,
    currentVelocity: null,
    currentDirection: null,
    waveHeight: null,
  },
  cyclone: { active: false },
};

export const useCycloneStore = create<CycloneState>((set, get) => ({
  mode: "LIVE",
  liveBasin: "Bay of Bengal",
  activeEventId: "biparjoy_2023", // Default
  timelineIndex: 0,
  isPlaying: false,
  introComplete: false,
  liveData: DEFAULT_LIVE_DATA,
  evidenceOpen: false,

  apiReplayData: null,
  apiMetricsData: null,
  apiClassificationsData: null,
  isLoadingData: false,

  setMode: (mode) => {
    set({ mode });
    if (mode === "LIVE") get().fetchLiveData();
  },

  setLiveBasin: (basin) => {
    set({ liveBasin: basin });
    get().fetchLiveData();
  },

  setActiveCyclone: (cycloneId) => {
    set({
      activeEventId: cycloneId,
      timelineIndex: 0,
      mode: "HISTORICAL",
      isPlaying: false,
    });
    get().fetchEventData(cycloneId);
  },

  setTimelineIndex: (index) => {
    const { apiReplayData } = get();
    if (!apiReplayData?.steps?.length) return;
    const clamped = Math.max(
      0,
      Math.min(index, apiReplayData.steps.length - 1),
    );
    set({ timelineIndex: clamped });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIntroComplete: (c) => set({ introComplete: c }),
  openEvidence: () => set({ evidenceOpen: true }),
  closeEvidence: () => set({ evidenceOpen: false }),

  getCurrentObservation: () => {
    const {
      apiReplayData,
      apiClassificationsData,
      timelineIndex,
      activeEventId,
      mode,
    } = get();
    if (
      !apiReplayData?.steps?.length ||
      !apiClassificationsData?.classifications?.length
    ) {
      if (mode !== "HISTORICAL") return null;

      const cyclone =
        CYCLONES.find((item) => item.id === activeEventId) || CYCLONES[0];
      const [lat, lon] = BASIN_CENTERS[cyclone.basin] || [15, 88];
      return {
        timestamp: cyclone.landfallTime,
        lat,
        lng: lon,
        step: { time: cyclone.landfallTime, prediction: null },
        classification: {
          center: { lat, lon },
          pattern: { label: "unlabeled", confidence: 0 },
          model: { name: "CycloNet archive", version: "local fallback" },
        },
      };
    }

    const step = apiReplayData.steps[timelineIndex];
    if (!step) return null;

    // Find the matching classification for the base time
    const classification =
      apiClassificationsData.classifications.find(
        (c: any) => c.timestamp === step.time,
      ) || apiClassificationsData.classifications[timelineIndex]; // Fallback to index if timestamp doesn't perfectly match

    if (!classification) return null;
    const center =
      getHistoricalCenter(
        apiReplayData,
        apiClassificationsData.classifications,
        timelineIndex,
      ) ?? classification.center;

    return {
      timestamp: step.time,
      lat: center.lat,
      lng: center.lon,
      step: step,
      classification: classification,
    };
  },

  fetchEventData: async (eventId: string) => {
    set({ isLoadingData: true });
    try {
      const [replayRes, metricsRes, classRes] = await Promise.all([
        fetch(`${API_BASE}/replay/${eventId}`),
        fetch(`${API_BASE}/metrics?event_id=${eventId}`),
        fetch(`${API_BASE}/ps70/classifications/${eventId}`),
      ]);

      const replay = replayRes.ok ? await replayRes.json() : null;
      const metrics = metricsRes.ok ? await metricsRes.json() : null;
      const classifications = classRes.ok ? await classRes.json() : null;

      set({
        apiReplayData: replay,
        apiMetricsData: metrics,
        apiClassificationsData: classifications,
        isLoadingData: false,
      });
    } catch (e) {
      console.error("Failed to fetch event data:", e);
      set({ isLoadingData: false });
    }
  },

  fetchLiveData: async () => {
    set((s) => ({ liveData: { ...s.liveData, status: "UPDATING" } }));
    try {
      const { liveBasin } = get();
      const lat = liveBasin === "Bay of Bengal" ? 15.0 : 17.0;
      const lng = liveBasin === "Bay of Bengal" ? 88.0 : 68.0;

      const [weatherRes, marineRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`,
        ),
        fetch(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,ocean_current_velocity,ocean_current_direction`,
        ),
      ]);

      const weather = await weatherRes.json();
      const marine = await marineRes.json();

      set({
        liveData: {
          status: "LIVE",
          lastUpdated: new Date().toISOString(),
          atmosphere: {
            windSpeed: weather.current?.wind_speed_10m ?? null,
            windDirection: weather.current?.wind_direction_10m ?? null,
            pressure: weather.current?.surface_pressure ?? null,
            humidity: weather.current?.relative_humidity_2m ?? null,
            rainfall: weather.current?.precipitation ?? null,
          },
          ocean: {
            sst: weather.current?.temperature_2m ?? null,
            currentVelocity: marine.current?.ocean_current_velocity ?? null,
            currentDirection: marine.current?.ocean_current_direction ?? null,
            waveHeight: marine.current?.wave_height ?? null,
          },
          cyclone: { active: false },
        },
      });
    } catch {
      set((s) => ({ liveData: { ...s.liveData, status: "OFFLINE" } }));
    }
  },
}));
