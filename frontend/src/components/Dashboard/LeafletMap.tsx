import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import {
  getHistoricalCenter,
  useCycloneStore,
} from "../../store/useCycloneStore";
import {
  DEFAULT_ZOOM,
  INDIA_BOUNDS,
  INDIA_CENTER,
  MAX_ZOOM,
  MIN_ZOOM,
} from "./mapConstants";
import { registerMap } from "./mapHelpers";
import { getLiveGibsDate } from "./gibsTime";

// ── Custom icons ────────────────────────────────────────────────────────────
const CycloneCentreIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:0;border:1.5px solid #ef4444;border-radius:50%;animation:pulse-ring 2.4s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute;top:5px;left:5px;width:12px;height:12px;background:#ef4444;border:1.5px solid #ffffff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.6);"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const LiveCentreIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:20px;height:20px;cursor:pointer;">
    <div style="position:absolute;inset:0;border:2px solid #38bdf8;border-radius:50%;animation:pulse-ring 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="position:absolute;top:5px;left:5px;width:10px;height:10px;background:#38bdf8;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 8px #38bdf8;"></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── Layer visibility context (passed down via props) ────────────────────────
export interface LayerVisibility {
  satellite: boolean;
  trajectory: boolean;
  structure: boolean;
  centre: boolean;
  forecastTrack: boolean;
  forecastCone: boolean;
  wind: boolean;
  ocean: boolean;
}

// ── Internal component that can access the map instance ─────────────────────
interface MapControllerProps {
  onMapReady: (map: L.Map) => void;
}
function MapController({ onMapReady }: MapControllerProps) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
interface LeafletMapProps {
  layers: LayerVisibility;
  onCentreClick?: () => void;
}

export function LeafletMap({ layers, onCentreClick }: LeafletMapProps) {
  const {
    mode,
    activeEventId,
    getCurrentObservation,
    liveData,
    liveBasin,
    apiReplayData,
    apiClassificationsData,
    timelineIndex,
  } = useCycloneStore();
  const obs = getCurrentObservation();
  const mapInstanceRef = useRef<L.Map | null>(null);
  const liveGibsDate = getLiveGibsDate();

  // Active basin coordinates
  const basinCoords: [number, number] =
    liveBasin === "Bay of Bengal" ? [15.0, 88.0] : [17.0, 68.0];

  // Store map instance on ready
  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
    registerMap(map);
  }, []);

  // Fly to cyclone or basin when event/mode/basin changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (mode === "HISTORICAL" && obs) {
      map.flyTo([obs.lat, obs.lng], 5, { duration: 1.4, easeLinearity: 0.25 });
    } else if (mode === "LIVE") {
      map.flyTo(basinCoords, 5, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [mode, activeEventId, liveBasin]);

  // Build the historical track coordinates up to current timeline index
  const trackCoords: [number, number][] = [];
  if (mode === "HISTORICAL" && apiClassificationsData?.classifications) {
    for (let i = 0; i <= timelineIndex; i++) {
      const center = getHistoricalCenter(
        apiReplayData,
        apiClassificationsData.classifications,
        i,
      );
      if (center) trackCoords.push([center.lat, center.lon]);
    }
  }

  // Build the forecast coords for this specific step (t12, t24)
  const forecastCoords: [number, number][] = [];
  if (mode === "HISTORICAL" && obs?.step?.prediction) {
    forecastCoords.push([obs.lat, obs.lng]); // Start at current center
    if (obs.step.prediction.t12?.center) {
      forecastCoords.push([
        obs.step.prediction.t12.center.lat,
        obs.step.prediction.t12.center.lon,
      ]);
    }
    if (obs.step.prediction.t24?.center) {
      forecastCoords.push([
        obs.step.prediction.t24.center.lat,
        obs.step.prediction.t24.center.lon,
      ]);
    }
  }

  const uncertaintyRadiusM = 85_000;

  return (
    <div className="absolute inset-0 w-full h-full">
      <MapContainer
        center={INDIA_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", background: "#080e18" }}
      >
        <MapController onMapReady={handleMapReady} />

        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="© Esri"
          zIndex={1}
          className="base-tiles"
        />

        {/* NASA GIBS Cloud Layer (Historical) */}
        {mode === "HISTORICAL" && layers.satellite && obs && (
          <TileLayer
            key={`hist-gibs-${obs.timestamp}`}
            url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${obs.timestamp.split("T")[0]}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
            opacity={0.68}
            zIndex={2}
            className="cloud-layer"
          />
        )}

        {/* Live Real-Time NASA GIBS Satellite Swath Layer */}
        {mode === "LIVE" && layers.satellite && (
          <TileLayer
            key={`live-gibs-${liveGibsDate}`}
            url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${liveGibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
            opacity={0.78}
            zIndex={2}
            className="cloud-layer"
          />
        )}

        {mode === "HISTORICAL" && obs && (
          <>
            {/* Observed track */}
            {layers.trajectory && trackCoords.length > 1 && (
              <Polyline
                positions={trackCoords}
                pathOptions={{ color: "#E7EEF4", weight: 2, opacity: 0.85 }}
              />
            )}

            {/* Forecast track */}
            {layers.forecastTrack && forecastCoords.length > 1 && (
              <Polyline
                positions={forecastCoords}
                pathOptions={{
                  color: "#FF7A45",
                  weight: 2,
                  dashArray: "5, 7",
                  opacity: 0.75,
                }}
              />
            )}

            {/* Uncertainty cone */}
            {layers.forecastCone && forecastCoords.length > 1 && (
              <Circle
                center={forecastCoords.at(-1)!}
                radius={uncertaintyRadiusM}
                pathOptions={{
                  color: "#FF7A45",
                  weight: 1,
                  dashArray: "3, 5",
                  fillColor: "#FF7A45",
                  fillOpacity: 0.07,
                }}
              />
            )}

            {/* Cyclone structure halo */}
            {layers.structure && (
              <Circle
                center={[obs.lat, obs.lng]}
                radius={220_000}
                pathOptions={{
                  color: "#4FC3E0",
                  weight: 0,
                  fillColor: "#4FC3E0",
                  fillOpacity: 0.1,
                }}
              />
            )}

            {/* Centre marker */}
            {layers.centre && (
              <Marker
                position={[obs.lat, obs.lng]}
                icon={CycloneCentreIcon}
                eventHandlers={{ click: () => onCentreClick?.() }}
              />
            )}
          </>
        )}

        {/* ── Live Mode: Real-time Basin Meteorological Observatory Beacon ── */}
        {mode === "LIVE" && layers.centre && (
          <Marker position={basinCoords} icon={LiveCentreIcon}>
            <Popup className="custom-popup">
              <div className="p-2.5 font-mono text-xs bg-ocean-950 text-white rounded-lg border border-ocean-750 shadow-2xl min-w-[210px] space-y-1.5">
                <div className="flex items-center justify-between border-b border-ocean-800 pb-1">
                  <span className="font-bold text-sky-300 text-[11px] uppercase tracking-wider">
                    {liveBasin} BUOY
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-confidence/20 text-confidence border border-confidence/30 font-bold">
                    LIVE TELEMETRY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  <div>
                    <span className="text-text-muted block text-[8px]">WIND</span>
                    <span className="text-sky-300 font-bold">{liveData.atmosphere.windSpeed ?? 13} km/h</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px]">DIRECTION</span>
                    <span className="text-white font-bold">{liveData.atmosphere.windDirection ?? 291}°</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px]">PRESSURE</span>
                    <span className="text-white font-bold">{liveData.atmosphere.pressure ?? 1011} hPa</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px]">HUMIDITY</span>
                    <span className="text-white font-bold">{liveData.atmosphere.humidity ?? 70}%</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px]">SEA TEMP</span>
                    <span className="text-amber-400 font-bold">{liveData.ocean.sst ?? 29.4}°C</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[8px]">WAVE HT</span>
                    <span className="text-white font-bold">{liveData.ocean.waveHeight ?? 1.8} m</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-ocean-800 text-[8px] text-text-faint flex items-center justify-between">
                  <span>NASA GIBS Live Swath</span>
                  <span className="text-sky-400 font-bold">{liveGibsDate}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ── Active Cyclone detected in live mode ── */}
        {mode === "LIVE" && layers.centre && liveData.cyclone.active && liveData.cyclone.lat && liveData.cyclone.lon && (
          <>
            <Circle
              center={[liveData.cyclone.lat, liveData.cyclone.lon]}
              radius={200_000}
              pathOptions={{
                color: "#ef4444",
                weight: 1,
                fillColor: "#ef4444",
                fillOpacity: 0.12,
              }}
            />
            <Marker
              position={[liveData.cyclone.lat, liveData.cyclone.lon]}
              icon={CycloneCentreIcon}
            >
              <Popup>
                <div className="p-2 font-mono text-xs bg-ocean-950 text-white rounded">
                  <div className="font-bold text-red-400">{liveData.cyclone.name || "ACTIVE CYCLONE"}</div>
                  <div>Wind: {liveData.cyclone.windSpeedKmh} km/h ({liveData.cyclone.windKnots} kt)</div>
                  <div>Pressure: {liveData.cyclone.pressure} hPa | {liveData.cyclone.dvorak}</div>
                  <div>IMD: {liveData.cyclone.category}</div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Leaflet CSS overrides */}
      <style>{`
        .leaflet-container { background: #080e18 !important; }
        .base-tiles        { filter: brightness(0.65) contrast(1.1) saturate(0.75) !important; }
        .cloud-layer       { filter: contrast(1.05) brightness(1.05) !important; }
        .leaflet-pane      { z-index: auto !important; }
        .leaflet-top, .leaflet-bottom { z-index: 10 !important; }
        .leaflet-popup-content-wrapper {
          background: #080e18 !important;
          color: #fff !important;
          border: 1px solid #1e293b !important;
          border-radius: 8px !important;
          padding: 0 !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.8) !important;
        }
        .leaflet-popup-content { margin: 0 !important; line-height: 1.4 !important; }
        .leaflet-popup-tip { background: #080e18 !important; }
        @keyframes pulse-ring {
          0%   { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
