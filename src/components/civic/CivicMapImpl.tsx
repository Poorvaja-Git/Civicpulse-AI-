import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import { severityColor } from "./bits";
import type { MapPoint } from "./map-types";

export default function CivicMap({
  points,
  height = 420,
  center,
  zoom = 12,
  onSelect,
}: {
  points: MapPoint[];
  height?: number;
  center?: [number, number] | undefined;
  zoom?: number | undefined;
  onSelect?: ((id: string) => void) | undefined;
}) {
  const fallbackCenter: [number, number] = center ?? [
    points.reduce((s, p) => s + p.lat, 0) / (points.length || 1) || 18.54,
    points.reduce((s, p) => s + p.lng, 0) / (points.length || 1) || 73.86,
  ];

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height, width: "100%", borderRadius: 16 }}
      whenReady={() => {
        // keeps leaflet happy inside flex/grid containers
        setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={Math.min(20, 7 + Math.sqrt(p.reports) * 3)}
          pathOptions={{
            color: severityColor[p.severity],
            fillColor: severityColor[p.severity],
            fillOpacity: 0.45,
            weight: 2,
          }}
          eventHandlers={{ click: () => onSelect?.(p.id) }}
        >
          <Tooltip direction="top" offset={L.point(0, -6)}>
            {p.title}
          </Tooltip>
          <Popup>
            <div style={{ minWidth: 200, fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ display: "block", marginBottom: 4 }}>{p.title}</strong>
              <div>📍 {p.location}</div>
              <div>🗂 {p.category}</div>
              <div>📊 Reports: {p.reports}</div>
              <div>
                ⚠️ Severity: <b>{p.severity}</b>
              </div>
              <div>
                🎯 Priority: <b>{p.priority}/100</b>
              </div>
              <div>🔄 Status: {p.status}</div>
              <div>🏛 {p.department}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
