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

  // 1. Initialize Map exactly once
  useEffect(() => {
    if (!mounted || !mapRef.current) return;

    let L;
    import("leaflet").then((leaflet) => {
      L = leaflet;
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        mapInstanceRef.current = map;
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted]);

  // 2. Update Markers when visitors change
  useEffect(() => {
    if (!mounted || !visitors || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;

      // Clear existing circle markers
      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          map.removeLayer(layer);
        }
      });

      const validVisitors = (visitors || []).filter(v => v.latitude && v.longitude);

      validVisitors.forEach(visitor => {
        const marker = L.circleMarker([visitor.latitude, visitor.longitude], {
          radius: 8,
          color: '#0ea5e9',
          fillColor: '#38bdf8',
          fillOpacity: 0.8,
          weight: 2
        }).addTo(map);

        const popupContent = `
          <div class="text-xs p-1">
            <p class="mb-1"><strong>IP:</strong> <span class="font-mono">${visitor.ip_address}</span></p>
            <p class="mb-1"><strong>Location:</strong> ${visitor.city || 'Unknown'}, ${visitor.country || 'Unknown'}</p>
            <p class="mb-1"><strong>Device:</strong> ${visitor.device_type || 'Unknown'} / ${visitor.browser || 'Unknown'}</p>
            <p><strong>Last Seen:</strong> ${new Date(visitor.last_seen).toLocaleString()}</p>
          </div>
        `;
        marker.bindPopup(popupContent);
      });
    });
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
