"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { useDispatch, useSelector } from "react-redux";
import { getLiveLocationsByShift } from "@/redux/location/locationSlice";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

interface LiveLocationModalProps {
  onClose: () => void;
  shiftId: number;
  workerId: number;
}

const LiveLocationModal: React.FC<LiveLocationModalProps> = ({
  onClose,
  shiftId,
  workerId,
}) => {
  const dispatch = useDispatch<any>();
  const state = useSelector((s: any) => s.location);
  const liveLocationsRaw = state?.liveLocations;

  // ✅ Debug log for liveLocations changes
  useEffect(() => {
    console.log("✅ Live Locations received:", state.liveLocations);
  }, [state.liveLocations]);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  // ✅ Fetch live locations when modal opens
  useEffect(() => {
    console.log("Dispatching getLiveLocationsByShift", { shiftId, workerId });
    dispatch(
      getLiveLocationsByShift({
        shiftId: Number(shiftId),
        workerId: Number(workerId),
      })
    );
  }, [dispatch, shiftId, workerId]);

  // ✅ Custom marker icon (Fix “M” issue)
  const customMarkerIcon = L.icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // ✅ Helper: normalize API response to array
  const normalizeToArray = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (Array.isArray(input.value)) return input.value;
    if (Array.isArray(input.data)) return input.data;
    if (typeof input === "object") {
      return Object.values(input).flat().filter(Boolean);
    }
    return [];
  };

  // ✅ Helper: extract numeric lat/lng keys safely
  const extractCoords = (p: any) => {
    if (!p || typeof p !== "object") return { lat: NaN, lng: NaN };
    const lat = Number(p.latitude ?? p.lat ?? p.Lat ?? p.y ?? p?.latLng?.lat ?? p.lat);
    const lng = Number(p.longitude ?? p.long ?? p.lng ?? p.Lon ?? p?.latLng?.lng ?? p.lng);
    return { lat, lng };
  };

  useEffect(() => {
    const liveLocations = normalizeToArray(liveLocationsRaw);

    if (!mapRef.current) return;

    // ✅ Safely destroy old map if it exists
    if (mapInstance.current && mapInstance.current.remove) {
      try {
        mapInstance.current.off();
        mapInstance.current.remove();
      } catch (err) {
        console.warn("🟡 Map cleanup warning:", err);
      }
      mapInstance.current = null;
    }

    if (!liveLocations || liveLocations.length === 0) {
      console.debug("🟡 No live locations found.");
      return;
    }

    // find first valid coordinates
    const firstValid = liveLocations.find((p: any) => {
      const { lat, lng } = extractCoords(p);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });

    if (!firstValid) {
      console.debug("⚠️ No valid coordinates found in liveLocations");
      return;
    }

    // ✅ Fix “container already initialized” bug
    if ((mapRef.current as any)._leaflet_id) {
      try {
        delete (mapRef.current as any)._leaflet_id;
      } catch {}
    }

    // Build cleaned list of numeric coords
    const points: { lat: number; lng: number; raw?: any }[] = liveLocations
      .map((p: any) => {
        const { lat, lng } = extractCoords(p);
        return { lat, lng, raw: p };
      })
      .filter((pt) => Number.isFinite(pt.lat) && Number.isFinite(pt.lng));

    if (points.length === 0) return;

    const center = points[0];
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const markers = L.markerClusterGroup();

    points.forEach((pt, i) => {
      const marker = L.marker([pt.lat, pt.lng], { icon: customMarkerIcon }).bindPopup(
        `<b>Point ${i + 1}</b><br>
         Lat: ${pt.lat.toFixed(5)}<br>
         Lng: ${pt.lng.toFixed(5)}${
          pt.raw?.created_at
            ? `<br><small>${new Date(pt.raw.created_at).toLocaleString()}</small>`
            : ""
        }`
      );
      markers.addLayer(marker);
    });

    map.addLayer(markers);
    mapInstance.current = map;

    // ✅ Ensure Leaflet resizes properly after render
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 300);

    return () => {
      try {
        if (mapInstance.current) {
          mapInstance.current.off();
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      } catch (err) {
        console.warn("🟡 Cleanup failed:", err);
      }
    };
  }, [liveLocationsRaw]);

  const loading = state?.loading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg w-full max-w-5xl shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 z-10 p-1 bg-white/50 dark:bg-gray-900/50 rounded-full"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
        Location Map — Shift #{shiftId}
        </h2>

        {loading ? (
          <div className="h-[450px] flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Loading live locations...
            </p>
          </div>
        ) : (
          <div
            ref={mapRef}
            id="live-map"
            className="h-[500px] w-full rounded-md"
          />
        )}
      </div>
    </div>
  );
};

export default LiveLocationModal;
