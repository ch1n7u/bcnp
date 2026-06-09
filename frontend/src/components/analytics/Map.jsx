"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function Map({ visitors }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    // Dynamically import leaflet to avoid window undefined on SSR
    import("leaflet").then((L) => {
      if (!mapInstanceRef.current) {
        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;

      // Clear existing layers if any (basic implementation, just clears all and re-adds)
      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      const validVisitors = (visitors || []).filter(v => v.latitude && v.longitude);

      validVisitors.forEach(visitor => {
        const marker = L.circleMarker([visitor.latitude, visitor.longitude], {
          radius: 6,
          color: '#0ea5e9',
          fillColor: '#38bdf8',
          fillOpacity: 0.7
        }).addTo(map);

        const popupContent = `
          <div class="text-xs">
            <p><strong>IP:</strong> ${visitor.ip_address}</p>
            <p><strong>Location:</strong> ${visitor.city}, ${visitor.region}, ${visitor.country}</p>
            <p><strong>Device:</strong> ${visitor.device_type} / ${visitor.browser}</p>
            <p><strong>Last Seen:</strong> ${new Date(visitor.last_seen).toLocaleString()}</p>
          </div>
        `;
        marker.bindPopup(popupContent);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, visitors]);

  if (!mounted) {
    return <div className="h-96 w-full animate-pulse rounded-2xl bg-slate-100"></div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div ref={mapRef} style={{ height: '400px', width: '100%', zIndex: 0 }}></div>
    </div>
  );
}
