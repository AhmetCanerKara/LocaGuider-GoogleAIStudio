import React, { useEffect } from 'react';
import { Place, PlaceCategory, TransportMode, RouteDetails } from '../types';
import { Coffee, Utensils, Calendar, X, Navigation, Heart, Star, ShoppingBag, Briefcase, Landmark, Loader2, Car, Footprints, Bike } from 'lucide-react';

interface PlaceDetailSheetProps {
  place: Place | null;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number };
  onRouteClick: (mode: TransportMode) => void;
  isRouting: boolean;
  routeDetails: RouteDetails | null;
  selectedMode: TransportMode;
}

export const PlaceDetailSheet: React.FC<PlaceDetailSheetProps> = ({ 
  place, 
  onClose, 
  userLocation,
  onRouteClick,
  isRouting = false,
  routeDetails,
  selectedMode
}) => {
  if (!place) return null;

  useEffect(() => {
     if (!routeDetails && !isRouting) {
       onRouteClick('driving');
     }
  }, [place?.id]);

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs} hr ${remainingMins} min`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const handleStartNavigation = () => {
    let gMode = 'driving';
    if (selectedMode === 'walking') gMode = 'walking';
    if (selectedMode === 'cycling') gMode = 'bicycling';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.location.latitude},${place.location.longitude}&travelmode=${gMode}`;
    window.open(url, '_blank');
  };

  return (
    <div className="absolute bottom-0 left-0 w-full z-[1001] animate-in slide-in-from-bottom duration-400 ease-out">
       <div className="bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] p-6 pb-10 border-t border-gray-50">
         
         <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5"></div>

         <div className="flex justify-between items-start mb-5">
           <div className="flex-1 pr-4">
             <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">{place.name}</h2>
             <div className="flex items-center gap-2 mt-1.5">
               <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{place.category}</span>
               {place.subtitle && <span className="text-xs text-gray-400">• {place.subtitle}</span>}
               {place.rating && <span className="text-xs font-bold text-amber-500 flex items-center">★ {place.rating.toFixed(1)}</span>}
             </div>
           </div>
           <button onClick={onClose} className="p-2.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
             <X size={20} className="text-gray-400" />
           </button>
         </div>

         <div className="flex p-1 bg-gray-100/80 rounded-2xl mb-6">
            <button 
              onClick={() => onRouteClick('driving')}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${selectedMode === 'driving' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Car size={18} />
              DRIVE
            </button>
            <button 
              onClick={() => onRouteClick('walking')}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${selectedMode === 'walking' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Footprints size={18} />
              WALK
            </button>
            <button 
              onClick={() => onRouteClick('cycling')}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${selectedMode === 'cycling' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Bike size={18} />
              BIKE
            </button>
         </div>

         <div className="flex items-center gap-3 mb-8 h-10 px-1">
            {isRouting ? (
               <div className="flex items-center gap-3 text-blue-500 font-medium">
                 <Loader2 size={22} className="animate-spin" />
                 <span className="text-sm">Optimizing path...</span>
               </div>
            ) : routeDetails ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatDuration(routeDetails.duration)}
                </span>
                <span className="text-sm font-semibold text-gray-400">
                  ({formatDistance(routeDetails.distance)})
                </span>
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Select travel mode</span>
            )}
         </div>

         <div className="flex gap-4">
           <button 
             onClick={handleStartNavigation}
             className="flex-[3] bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
           >
             <Navigation size={20} fill="currentColor" />
             Start Navigation
           </button>
           <button className="flex-1 bg-gray-50 text-gray-600 rounded-2xl font-bold flex items-center justify-center hover:bg-gray-100 active:scale-[0.98] transition-all border border-gray-100">
             <Heart size={22} />
           </button>
         </div>

       </div>
    </div>
  );
};