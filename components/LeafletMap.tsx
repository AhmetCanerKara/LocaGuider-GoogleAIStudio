import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Place, PlaceCategory } from '../types';

interface LeafletMapProps {
  center: { latitude: number; longitude: number };
  zoom?: number;
  places?: Place[];
  routeCoords?: [number, number][]; // Array of [lat, lng]
  recenterTrigger?: number;
  onMarkerClick?: (place: Place) => void;
  onMapMove?: (bounds: { south: number, west: number, north: number, east: number }, zoom: number) => void;
}

// Flat, minimal SVG icons
const CAFE_ICON_SVG = `<svg viewBox="0 0 24 24" fill="white"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4v-2z"/></svg>`;
const RESTAURANT_ICON_SVG = `<svg viewBox="0 0 24 24" fill="white"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`;
const SHOPPING_ICON_SVG = `<svg viewBox="0 0 24 24" fill="white"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2-2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`;
const MUSEUM_ICON_SVG = `<svg viewBox="0 0 24 24" fill="white"><path d="M12 1L2 6v2h20V6L12 1zM5 10v8H2v2h20v-2h-3v-8h-2v8h-3v-8h-2v8H7v-8H5z"/></svg>`;
const PIN_ICON_SVG = `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`;

const createCategoryIcon = (category: PlaceCategory) => {
  let bgColor = 'bg-slate-400';
  let iconSvg = PIN_ICON_SVG;

  switch (category) {
    case PlaceCategory.Cafe: bgColor = 'bg-amber-500'; iconSvg = CAFE_ICON_SVG; break;
    case PlaceCategory.Restaurant: bgColor = 'bg-rose-500'; iconSvg = RESTAURANT_ICON_SVG; break;
    case PlaceCategory.Shopping: bgColor = 'bg-indigo-500'; iconSvg = SHOPPING_ICON_SVG; break;
    case PlaceCategory.Museum:
    case PlaceCategory.Historical: bgColor = 'bg-emerald-600'; iconSvg = MUSEUM_ICON_SVG; break;
    default: bgColor = 'bg-slate-500'; iconSvg = PIN_ICON_SVG;
  }

  return L.divIcon({
    className: 'modern-map-marker-container',
    html: `<div class="${bgColor} w-9 h-9 rounded-full flex items-center justify-center border-[2.5px] border-white shadow-sm transition-all duration-300 transform scale-0 animate-pop-in p-1.5">${iconSvg}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const UserIcon = L.divIcon({
  className: 'user-marker-pulse',
  html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-40"></div>
            <div class="relative w-4 h-4 bg-blue-600 border-[2px] border-white rounded-full shadow-lg"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const RecenterAutomatically = ({ lat, lng, trigger }: { lat: number; lng: number, trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, trigger, map]);
  return null;
};

const RouteFitter = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 2) {
      // Calculate direct distance between start and end to avoid flickering on minor updates
      const start = L.latLng(coords[0]);
      const end = L.latLng(coords[coords.length - 1]);
      const distance = start.distanceTo(end);

      // Only refit if the points represent a meaningful route (>100 meters)
      // This prevents the map from "jumping" to 0,0 or far away when data is stale
      if (distance > 100) {
        const bounds = L.latLngBounds(coords);
        map.flyToBounds(bounds, { 
          paddingTopLeft: [40, 40],
          paddingBottomRight: [40, 400], 
          duration: 1.5,
          easeLinearity: 0.1
        });
      }
    }
  }, [coords, map]);
  return null;
};

const MapClickHandler = ({ onMapClick }: { onMapClick: () => void }) => {
  useMapEvents({ click: () => onMapClick() });
  return null;
};

const MapEvents = ({ onMapMove }: { onMapMove?: (bounds: any, zoom: number) => void }) => {
  const map = useMap();
  const handleMove = () => {
    if (onMapMove) {
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      onMapMove({
        south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast()
      }, zoom);
    }
  };
  useMapEvents({ moveend: handleMove });
  useEffect(() => { handleMove(); }, []);
  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({ 
  center, zoom = 14, places = [], routeCoords = [], recenterTrigger = 0, onMarkerClick, onMapMove 
}) => {
  return (
    <div className="w-full h-full relative z-0 bg-[#f9f9f9]">
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop-in {
          animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
      <MapContainer 
        center={[center.latitude, center.longitude]} 
        zoom={zoom} 
        style={{ height: "100%", width: "100%", background: "#f8f9fa" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            pathOptions={{ className: 'route-line-animated' }}
            color="#2563eb"
            weight={6}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}

        <Marker position={[center.latitude, center.longitude]} icon={UserIcon} />

        {places.map(place => (
          <Marker 
            key={place.id} 
            position={[place.location.latitude, place.location.longitude]}
            icon={createCategoryIcon(place.category)}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                if (onMarkerClick) onMarkerClick(place);
              }
            }}
          />
        ))}

        <RecenterAutomatically lat={center.latitude} lng={center.longitude} trigger={recenterTrigger} />
        <RouteFitter coords={routeCoords} />
        <MapClickHandler onMapClick={() => onMarkerClick && onMarkerClick(null as any)} />
        <MapEvents onMapMove={onMapMove} />
      </MapContainer>
    </div>
  );
};