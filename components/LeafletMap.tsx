import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Place, PlaceCategory } from '../types';

interface LeafletMapProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  places?: Place[];
  recenterTrigger?: number;
  onMarkerClick?: (place: Place) => void;
  onMapMove?: (bounds: { south: number, west: number, north: number, east: number }, zoom: number) => void;
}

// 1. Define SVG strings for categories to avoid external dependencies
const CAFE_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
`;

const RESTAURANT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
`;

const EVENT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
`;

const SHOPPING_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
`;

const SERVICE_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><line x1="16" x2="16" y1="21" y2="17"/><line x1="8" x2="8" y1="21" y2="17"/><line x1="12" x2="12" y1="12" y2="12"/><line x1="12" x2="12" y1="7" y2="2"/></svg>
`;

const DEFAULT_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
`;

// 2. Factory to create DivIcons based on category
const createCategoryIcon = (category: PlaceCategory) => {
  let bgColor = 'bg-gray-500';
  let iconSvg = DEFAULT_PIN_SVG;

  switch (category) {
    case PlaceCategory.Cafe:
      bgColor = 'bg-blue-500';
      iconSvg = CAFE_ICON_SVG;
      break;
    case PlaceCategory.Restaurant:
      bgColor = 'bg-orange-500';
      iconSvg = RESTAURANT_ICON_SVG;
      break;
    case PlaceCategory.Event:
      bgColor = 'bg-purple-600';
      iconSvg = EVENT_ICON_SVG;
      break;
    case PlaceCategory.Shopping:
      bgColor = 'bg-teal-500';
      iconSvg = SHOPPING_ICON_SVG;
      break;
    case PlaceCategory.Service:
      bgColor = 'bg-slate-600';
      iconSvg = SERVICE_ICON_SVG;
      break;
    case PlaceCategory.Museum:
      bgColor = 'bg-rose-500';
      iconSvg = DEFAULT_PIN_SVG; // Use default pin for museum but red
      break;
    default:
      bgColor = 'bg-gray-500';
      iconSvg = DEFAULT_PIN_SVG;
  }

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="${bgColor} w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white">${iconSvg}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20], // Center it
  });
};

const UserIcon = L.divIcon({
  className: 'user-marker-pulse',
  html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75"></div>
            <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Helper component to recenter map when props change
const RecenterAutomatically = ({ lat, lng, trigger }: { lat: number; lng: number, trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, trigger, map]);
  return null;
};

// Helper to handle map clicks (close detail sheet)
const MapClickHandler = ({ onMapClick }: { onMapClick: () => void }) => {
  useMapEvents({
    click: () => {
      onMapClick();
    },
  });
  return null;
};

// Handle Map Events (Move, Zoom)
const MapEvents = ({ onMapMove }: { onMapMove?: (bounds: any, zoom: number) => void }) => {
  const map = useMap();

  const handleMove = () => {
    if (onMapMove) {
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      onMapMove({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast()
      }, zoom);
    }
  };

  useMapEvents({
    moveend: handleMove,
  });

  // Trigger once on mount to load initial data
  useEffect(() => {
    handleMove();
  }, []);

  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({ center, zoom = 14, places = [], recenterTrigger = 0, onMarkerClick, onMapMove }) => {
  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[center.latitude, center.longitude]} 
        zoom={zoom} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false} // Disable default zoom control for mobile app feel
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current User Location */}
        <Marker position={[center.latitude, center.longitude]} icon={UserIcon} />

        {/* Nearby Places Markers */}
        {places.map(place => (
          <Marker 
            key={place.id} 
            position={[place.location.latitude, place.location.longitude]}
            icon={createCategoryIcon(place.category)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e); // Prevent map click
                if (onMarkerClick) onMarkerClick(place);
              }
            }}
          />
        ))}

        <RecenterAutomatically 
          lat={center.latitude} 
          lng={center.longitude} 
          trigger={recenterTrigger}
        />
        
        <MapClickHandler onMapClick={() => onMarkerClick && onMarkerClick(null as any)} />
        
        <MapEvents onMapMove={onMapMove} />
      </MapContainer>
    </div>
  );
};