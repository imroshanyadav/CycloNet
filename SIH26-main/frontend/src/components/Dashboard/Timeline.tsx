import { useCycloneStore } from '../../store/useCycloneStore';
import { CYCLONES } from '../../data/cyclones';

function formatLabel(ts: string): { date: string; time: string } {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).toUpperCase();
  const time = d.toISOString().slice(11, 16) + 'Z';
  return { date, time };
}

export function Timeline() {
  const { apiReplayData, activeEventId, mode, timelineIndex, setTimelineIndex } = useCycloneStore();
  const fallbackCyclone = CYCLONES.find((cyclone) => cyclone.id === activeEventId) || CYCLONES[0];
  const steps = apiReplayData?.steps?.length
    ? apiReplayData.steps
    : mode === 'HISTORICAL'
      ? [{ time: fallbackCyclone.landfallTime }]
      : [];

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-auto">
      <div className="glass-chrome rounded-lg px-4 lg:px-6 py-2.5 shadow-panel border border-ocean-750 bg-ocean-900/95 relative overflow-hidden flex flex-col gap-1.5">
        
        {/* Header label */}
        <div className="flex items-center justify-between px-1 text-[9px] font-mono text-text-muted uppercase">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ir" />
            SYNOPTIC TRAJECTORY SCRUBBER (UTC ZULU)
          </span>
          <span className="text-text-faint">
            STEP {timelineIndex + 1} OF {steps.length}
          </span>
        </div>

        {/* Scrollable Container */}
        <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-3.5 relative py-1.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          {/* Track line spanning full scroll width */}
          <div className="absolute left-0 right-0 top-[15px] h-px bg-ocean-700/80 z-0 min-w-full" />

          {/* Timestamps */}
          {steps.map((step: any, idx: number) => {
            const active = idx === timelineIndex;
            const { date, time } = formatLabel(step.time);
            return (
              <button
                key={idx}
                onClick={() => setTimelineIndex(idx)}
                className={`relative z-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group flex-shrink-0 w-12 ${
                  active ? 'text-white' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <div 
                  className={`w-2.5 h-2.5 rounded-sm mb-1.5 transition-all ${
                    active ? 'bg-ir border border-white shadow-subtle scale-110' : 'bg-ocean-800 border border-ocean-700 group-hover:bg-ocean-700'
                  }`} 
                />
                <span className={`text-[9px] font-mono tracking-wider ${active ? 'font-bold text-ir' : 'font-medium'}`}>{date}</span>
                <span className="text-[8px] font-mono text-text-faint">{time}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
