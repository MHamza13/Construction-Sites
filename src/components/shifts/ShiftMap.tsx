"use client";
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// لیفلیٹ کی CSS کو لوڈ کرنے اور مارکر آئیکن کے ایشو کو فکس کرنے کے لیے
const customMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapContainerProps {
  lat: number;
  lng: number;
  label: string;
}

// ایک چھوٹا ری یوزایبل میپ کمپوننٹ
const LeafletSingleMap = ({ lat, lng, label }: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;

    // پرانے میپ کو ختم کریں اگر وہ موجود ہے
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // میپ شروع کریں
    const map = L.map(mapRef.current).setView([lat, lng], 15);
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // مارکر لگائیں
    L.marker([lat, lng], { icon: customMarkerIcon })
      .addTo(map)
      .bindPopup(`<b>${label}</b><br>Lat: ${lat}<br>Lng: ${lng}`)
      .openPopup();

    // سائز کو ریفریش کریں تاکہ میپ کٹا ہوا نہ نظر آئے
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, label]);

  return <div ref={mapRef} className="h-[400px] w-full rounded-md shadow-inner border border-gray-200 dark:border-gray-700" />;
};

const ShiftMap = ({ onClose, checkInLat, checkInLong, endShiftLat, endShiftLong }: any) => {
  const hasCheckIn = checkInLat != null && checkInLong != null;
  const hasEndShift = endShiftLat != null && endShiftLong != null;

  // اگر کوئی بھی لوکیشن نہ ہو
  if (!hasCheckIn && !hasEndShift) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-md shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Location Not Available</h2>
          <p className="text-gray-600 dark:text-gray-400">No location data found for this shift.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg w-full max-w-6xl shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 z-50 p-1 bg-white dark:bg-gray-800 rounded-full border shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Shift Location Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-In Section */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">
              Check-In Location
            </h3>
            {hasCheckIn ? (
              <LeafletSingleMap lat={Number(checkInLat)} lng={Number(checkInLong)} label="Check-In" />
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">No Check-In recorded.</p>
              </div>
            )}
          </div>

          {/* End Shift Section */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">
              End Shift Location
            </h3>
            {hasEndShift ? (
              <LeafletSingleMap lat={Number(endShiftLat)} lng={Number(endShiftLong)} label="End Shift" />
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-gray-500 dark:text-gray-400">No End Shift recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftMap;