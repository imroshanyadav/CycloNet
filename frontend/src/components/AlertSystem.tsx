import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  bulletinNo?: string;
  message: string;
  timestamp: Date;
  location?: string;
  cycloneName?: string;
  windSpeed?: number;
  category?: string;
}

interface AlertSystemProps {
  open: boolean;
  onClose: () => void;
}

export function AlertSystem({ open, onClose }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Official IMD & NDMA meteorological warning bulletins
    const officialBulletins: Alert[] = [
      {
        id: '1',
        type: 'critical',
        bulletinNo: 'BOB-04/2026/18',
        title: 'STAGE-IV RED WARNING: LANDFALL THREAT ADVISORY',
        message: 'Very Severe Cyclonic Storm (VSCS) Biparjoy centered near 22.4°N, 68.2°E. Damaging gale winds reaching 120-130 km/h gusting to 145 km/h expected along coastal Saurashtra and Kutch. Storm surge of 2.5–3.0m above astronomical tide anticipated.',
        timestamp: new Date(Date.now() - 1000 * 60 * 18),
        location: 'Gujarat Coast / Saurashtra & Kutch',
        cycloneName: 'Biparjoy',
        windSpeed: 120,
        category: 'VSCS (STAGE-IV)'
      },
      {
        id: '2',
        type: 'warning',
        bulletinNo: 'NIO-SURGE/09',
        title: 'COASTAL INUNDATION & FISHERMEN WARNING',
        message: 'Sea conditions HIGH to PHENOMENAL. Total suspension of all marine and port operations advised across Kandla, Okha, and Porbandar. Port Signal LC-VIII hoisted.',
        timestamp: new Date(Date.now() - 1000 * 60 * 50),
        location: 'North-East Arabian Sea Ports',
        cycloneName: 'Biparjoy',
        windSpeed: 115,
        category: 'PORT WARNING'
      },
      {
        id: '3',
        type: 'warning',
        bulletinNo: 'TRK-CORR/03',
        title: 'REVISED T+24H TRACK TRAJECTORY CONE UPDATE',
        message: 'Kinematic track center shifted 18 km northwards towards Jakhau Port. Multi-model ensemble consensus indicates landfall window between 12:00 UTC and 15:00 UTC.',
        timestamp: new Date(Date.now() - 1000 * 60 * 110),
        location: 'Jakhau Port Corridor',
        cycloneName: 'Biparjoy',
        category: 'TRACK UPDATE'
      },
      {
        id: '4',
        type: 'info',
        bulletinNo: 'ADT-DVORAK/12',
        title: 'AUTOMATED DVORAK STRUCTURAL CLASSIFICATION',
        message: 'INSAT-3DR TIR1 (10.8µm) imagery classifies system as Eye Pattern (T-Number: T4.5 / CI: 4.5). Eyewall cloud-top brightness temperature recorded at -74°C with high symmetry.',
        timestamp: new Date(Date.now() - 1000 * 60 * 170),
        location: 'Arabian Sea Basin',
        cycloneName: 'Biparjoy',
        category: 'STRUCTURAL ANALYSIS'
      },
      {
        id: '5',
        type: 'success',
        bulletinNo: 'VERIF-MAE/01',
        title: 'TRACK CENTER ERROR VERIFICATION',
        message: 'T+12 hour predicted center verified against radar ground-truth at 32 km displacement error. Statistical confidence verified above 94.2%.',
        timestamp: new Date(Date.now() - 1000 * 60 * 240),
        location: 'NIO Radar Domain'
      },
      {
        id: '6',
        type: 'info',
        bulletinNo: 'SAT-PASS/07',
        title: 'GEOSTATIONARY INGESTION CYCLE COMPLETE',
        message: 'INSAT-3DR 74.0°E full-disk sector scan processed and calibrated. 81 infrared multi-spectral frames indexed and verified against archive database.',
        timestamp: new Date(Date.now() - 1000 * 60 * 320),
        location: 'Earth Station Space Payload'
      }
    ];

    setAlerts(officialBulletins);
  }, []);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle size={18} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={18} className="text-amber-400" />;
      case 'info':
        return <Info size={18} className="text-sky-400" />;
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-400" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-alert/10 border-alert/30 hover:border-alert/50';
      case 'warning':
        return 'bg-amber-400/10 border-amber-400/30 hover:border-amber-400/50';
      case 'info':
        return 'bg-ocean-850/90 border-ocean-750 hover:border-ocean-700';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diff < 1) return 'JUST NOW';
    if (diff < 60) return `${diff}M AGO`;
    if (diff < 1440) return `${Math.floor(diff / 60)}H AGO`;
    return date.toISOString().replace('T', ' ').substring(0, 16) + 'Z';
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[88vh] bg-ocean-900 rounded-xl border border-ocean-800 shadow-glass overflow-hidden flex flex-col font-sans">
        
        {/* Institutional Bulletin Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ocean-800 bg-ocean-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-ocean-850 border border-ocean-750 flex items-center justify-center text-alert">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  SPECIAL TROPICAL CYCLONE WARNING BULLETINS
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider bg-ocean-800 text-text-muted border border-ocean-700">
                  RSMC / NDMA DISPATCH
                </span>
              </div>
              <p className="text-[10px] font-mono text-text-muted uppercase mt-0.5">
                OFFICIAL METEOROLOGICAL DISASTER RISK ADVISORIES
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 flex items-center justify-center text-text-muted hover:text-white transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Threat Level Summary Counters */}
        <div className="grid grid-cols-4 gap-2 px-6 py-3 border-b border-ocean-800 bg-ocean-950/40 font-mono">
          <div className="text-center p-2 rounded bg-ocean-900 border border-ocean-800">
            <div className="text-lg font-bold text-alert">{alerts.filter(a => a.type === 'critical').length}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider">STAGE-IV RED</div>
          </div>
          <div className="text-center p-2 rounded bg-ocean-900 border border-ocean-800">
            <div className="text-lg font-bold text-amber-400">{alerts.filter(a => a.type === 'warning').length}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider">STAGE-III ORANGE</div>
          </div>
          <div className="text-center p-2 rounded bg-ocean-900 border border-ocean-800">
            <div className="text-lg font-bold text-sky-400">{alerts.filter(a => a.type === 'info').length}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider">DIAGNOSTIC ADVISORY</div>
          </div>
          <div className="text-center p-2 rounded bg-ocean-900 border border-ocean-800">
            <div className="text-lg font-bold text-confidence">{alerts.filter(a => a.type === 'success').length}</div>
            <div className="text-[9px] text-text-muted uppercase tracking-wider">VERIFICATION</div>
          </div>
        </div>

        {/* Bulletins List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-md bg-ocean-850 border border-ocean-800 flex items-center justify-center mx-auto mb-3 text-confidence">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-xs font-mono text-text-muted uppercase tracking-wider">No active storm bulletins</p>
              <p className="text-[11px] text-text-faint mt-1">North Indian Ocean surveillance nominal.</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border transition-all ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {alert.bulletinNo && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-ocean-950 text-text-faint border border-ocean-800">
                            {alert.bulletinNo}
                          </span>
                        )}
                        <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                          {alert.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="flex-shrink-0 w-5 h-5 rounded hover:bg-ocean-800 flex items-center justify-center text-text-faint hover:text-white transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <p className="text-text-secondary text-xs mb-2.5 leading-relaxed font-sans">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted flex-wrap">
                      <span className="flex items-center gap-1.5 text-text-faint">
                        <span className="w-1 h-1 rounded-full bg-text-faint" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                      {alert.location && (
                        <span className="flex items-center gap-1.5 text-text-muted">
                          <span className="w-1 h-1 rounded-full bg-ocean-700" />
                          {alert.location}
                        </span>
                      )}
                      {alert.cycloneName && (
                        <span className="px-1.5 py-0.2 rounded bg-ocean-850 text-sky-300 font-semibold border border-ocean-800">
                          {alert.cycloneName.toUpperCase()}
                        </span>
                      )}
                      {alert.windSpeed && (
                        <span className="text-amber-300">
                          GALE: {alert.windSpeed} KT ({Math.round(alert.windSpeed * 1.852)} KM/H)
                        </span>
                      )}
                      {alert.category && (
                        <span className="px-1.5 py-0.2 rounded bg-ocean-950 text-alert font-bold border border-alert/20">
                          {alert.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Institutional Dispatch Footer */}
        <div className="px-6 py-3 border-t border-ocean-800 bg-ocean-950/80 font-mono text-[10px] flex items-center justify-between text-text-muted">
          <span>SOURCE: RSMC TROPICAL CYCLONES NEW DELHI / NDMA DISASTER ADVISORY</span>
          <button
            onClick={() => setAlerts([])}
            className="px-2.5 py-1 rounded bg-ocean-850 hover:bg-ocean-800 border border-ocean-750 text-text-muted hover:text-white transition-all uppercase tracking-wider text-[9px]"
          >
            Clear Archive
          </button>
        </div>
      </div>
    </div>
  );
}
