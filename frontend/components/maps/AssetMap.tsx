/**
 * Geospatial Asset Map
 *
 * Interactive map showing asset locations with risk overlays
 * Uses Leaflet for mapping functionality
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface AssetMapMarker {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
  isCritical: boolean;
  capacity?: number;
  lastInspection?: string;
}

interface AssetMapProps {
  assets: AssetMapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onAssetClick?: (asset: AssetMapMarker) => void;
}

const riskColors = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const assetIcons = {
  TREATMENT_PLANT: '🏭',
  RESERVOIR: '💧',
  PUMP_STATION: '⚡',
  PIPELINE: '🔧',
  BORE: '🕳️',
  OTHER: '📍',
};

export function AssetMap({
  assets,
  center = [-41.2865, 174.7762], // Wellington, NZ
  zoom = 13,
  height = '600px',
  onAssetClick,
}: AssetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetMapMarker | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter assets by risk level
    const filteredAssets = filterRisk === 'ALL'
      ? assets
      : assets.filter(a => a.riskLevel === filterRisk);

    // Add markers for each asset
    filteredAssets.forEach(asset => {
      const color = riskColors[asset.riskLevel];
      const icon = assetIcons[asset.type as keyof typeof assetIcons] || '📍';

      // Create custom icon
      const customIcon = L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ${asset.isCritical ? 'animation: pulse 2s infinite;' : ''}
          ">
            ${icon}
          </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([asset.latitude, asset.longitude], {
        icon: customIcon,
      }).addTo(mapInstanceRef.current!);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${asset.name}</h3>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
            <div><strong>Type:</strong> ${asset.type.replace('_', ' ')}</div>
            <div><strong>Risk:</strong> <span style="color: ${color}; font-weight: bold;">${asset.riskLevel}</span></div>
            <div><strong>Condition:</strong> ${asset.condition}</div>
            ${asset.capacity ? `<div><strong>Capacity:</strong> ${asset.capacity.toLocaleString()} m³/day</div>` : ''}
            ${asset.lastInspection ? `<div><strong>Last Inspection:</strong> ${new Date(asset.lastInspection).toLocaleDateString()}</div>` : ''}
            ${asset.isCritical ? '<div style="color: red; font-weight: bold; margin-top: 4px;">⚠️ CRITICAL ASSET</div>' : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Handle click
      marker.on('click', () => {
        setSelectedAsset(asset);
        if (onAssetClick) {
          onAssetClick(asset);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (filteredAssets.length > 0) {
      const bounds = L.latLngBounds(
        filteredAssets.map(a => [a.latitude, a.longitude])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [assets, filterRisk, onAssetClick]);

  return (
    <div className="w-full">
      {/* Map Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by Risk:</span>
          <div className="flex gap-2">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(risk => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filterRisk === risk
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filterRisk === 'ALL' ? assets.length : assets.filter(a => a.riskLevel === filterRisk).length} assets
        </div>
      </div>

      {/* Map Legend */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Levels</h4>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(riskColors).map(([risk, color]) => (
            <div key={risk} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm text-gray-700">{risk}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💓 Pulsing markers indicate critical assets requiring immediate attention
        </p>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height, borderRadius: '8px' }}
        className="border-2 border-gray-200 shadow-lg"
      />

      {/* Selected Asset Details */}
      {selectedAsset && (
        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-gray-800">{selectedAsset.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAsset.type.replace('_', ' ')} • Risk: <span style={{ color: riskColors[selectedAsset.riskLevel] }} className="font-bold">{selectedAsset.riskLevel}</span>
              </p>
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Pulse animation CSS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
