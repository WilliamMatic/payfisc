"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { X, Save, Trash2, Loader2 } from "lucide-react";
import { ZoneStationnement } from "@/services/stationnement/types";
import { updateZone } from "@/services/stationnement/stationnementService";

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ZONE_COLORS: Record<string, string> = {
  parking: "#6366f1",
  gare: "#f59e0b",
  rue: "#10b981",
};
const DEFAULT_COLOR = "#3b82f6";

interface Props {
  zone: ZoneStationnement;
  onClose: () => void;
  onSaved: () => void;
}

export default function ZoneMapModal({ zone, onClose, onSaved }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const zoneColor = ZONE_COLORS[zone.type] || DEFAULT_COLOR;
  const lat = zone.latitude ? Number(zone.latitude) : -4.325;
  const lng = zone.longitude ? Number(zone.longitude) : 15.3125;

  const getGeoJSON = useCallback(() => {
    if (!drawnItemsRef.current) return null;
    const layers = drawnItemsRef.current.getLayers();
    if (layers.length === 0) return null;
    const gj = drawnItemsRef.current.toGeoJSON();
    return JSON.stringify(gj);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const geojson = getGeoJSON();
      const res = await updateZone({
        id: zone.id,
        nom: zone.nom,
        type: zone.type,
        description: zone.description,
        tarif: zone.tarif,
        mode_tarification: zone.mode_tarification,
        capacite: zone.capacite,
        latitude: zone.latitude,
        longitude: zone.longitude,
        geojson: geojson || null,
        actif: zone.actif,
      });
      if (res.status === "success") {
        onSaved();
        onClose();
      } else {
        setError(res.message || "Erreur");
      }
    } catch {
      setError("Erreur serveur");
    }
    setSaving(false);
  };

  const handleClear = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
      setHasChanges(true);
    }
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 18);
    mapInstanceRef.current = map;

    const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: '&copy; Esri &mdash; Esri, Maxar, Earthstar Geographics',
      maxNativeZoom: 18,
      maxZoom: 22,
    });

    const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxNativeZoom: 19,
      maxZoom: 22,
    });

    const hybrid = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
      maxNativeZoom: 18,
      maxZoom: 22,
    });

    satellite.addTo(map);
    hybrid.addTo(map);

    L.control.layers({
      "Satellite": satellite,
      "Plan": streets,
    }, {
      "Noms des rues": hybrid,
    }, { position: "topright" }).addTo(map);

    // Marker at center
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`<strong>${zone.nom}</strong><br/>${zone.type} — ${zone.mode_tarification}`)
      .openPopup();

    // Drawn items layer
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Load existing GeoJSON
    if (zone.geojson) {
      try {
        const gj = typeof zone.geojson === "string" ? JSON.parse(zone.geojson) : zone.geojson;
        L.geoJSON(gj, {
          style: () => ({
            color: zoneColor,
            weight: 3,
            opacity: 0.8,
            fillColor: zoneColor,
            fillOpacity: 0.2,
          }),
          pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 8, color: zoneColor, fillColor: zoneColor, fillOpacity: 0.4 }),
          onEachFeature: (_, layer) => drawnItems.addLayer(layer),
        });
        if (drawnItems.getLayers().length > 0) {
          map.fitBounds(drawnItems.getBounds().pad(0.2));
        }
      } catch (e) {
        console.error("Invalid GeoJSON:", e);
      }
    }

    // Draw controls
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: zoneColor, weight: 3, fillColor: zoneColor, fillOpacity: 0.2 },
        },
        circle: {
          shapeOptions: { color: zoneColor, weight: 3, fillColor: zoneColor, fillOpacity: 0.2 },
        },
        rectangle: {
          shapeOptions: { color: zoneColor, weight: 3, fillColor: zoneColor, fillOpacity: 0.2 },
        },
        polyline: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const evt = e as unknown as L.DrawEvents.Created;
      const layer = evt.layer;
      // For circles, store radius in properties
      if (evt.layerType === "circle") {
        const circle = layer as L.Circle;
        const center = circle.getLatLng();
        const radius = circle.getRadius();
        (layer as unknown as { feature: GeoJSON.Feature }).feature = {
          type: "Feature",
          properties: { radius, center: [center.lat, center.lng] },
          geometry: { type: "Point", coordinates: [center.lng, center.lat] },
        };
      }
      drawnItems.addLayer(layer);
      setHasChanges(true);
    });

    map.on(L.Draw.Event.EDITED, () => setHasChanges(true));
    map.on(L.Draw.Event.DELETED, () => setHasChanges(true));

    // Ensure map renders correctly
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: zoneColor + "20" }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zoneColor }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{zone.nom}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{zone.type} — {lat.toFixed(5)}, {lng.toFixed(5)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Info bar */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Utilisez les outils de dessin (à droite) pour délimiter la zone : <strong>polygone</strong>, <strong>rectangle</strong> ou <strong>cercle</strong></span>
          {hasChanges && <span className="text-amber-500 font-medium">● Modifications non enregistrées</span>}
        </div>

        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>
        )}

        {/* Map */}
        <div className="flex-1 min-h-[400px]">
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: 400 }} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" /> Effacer le tracé
          </button>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium">Fermer</button>
            <button onClick={handleSave} disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-medium transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer la zone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
