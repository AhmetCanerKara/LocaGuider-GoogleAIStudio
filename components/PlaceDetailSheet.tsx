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

  // Initial fetch on mount or place change (default to driving)
  useEffect(() => {
     if (!routeDetails && !isRouting) {
       onRouteClick('driving');
     }
  }, [place?.id]); // Only when ID changes

  // Helper to format time (seconds -> min/hr)
  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs} hr ${remainingMins} min`;
  };

  // Helper to format distance (meters -> km/m)
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const handleStartNavigation = () => {
    // Universal link for Google Maps / Apple Maps
    // We can specify mode in google maps url: dir_action=navigate&travelmode=driving|walking|bicycling
    let gMode = 'driving';
    if (selectedMode === 'walking') gMode = 'walking';
    if (selectedMode === 'cycling') gMode = 'bicycling';

    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.location.latitude},${place.location.longitude}&travelmode=${gMode}`;
    window.open(url, '_blank');
  };

  const getIcon = () => {
    switch (place.category) {
      case PlaceCategory.Cafe: return <Coffee size={24} className="text-blue-600" />;
      case PlaceCategory.Restaurant: return <Utensils size={24} className="text-orange-600" />;
      case PlaceCategory.Event: return <Calendar size={24} className="text-purple-600" />;
      case PlaceCategory.Shopping: return <ShoppingBag size={24} className="text-teal-600" />;
      case PlaceCategory.Service: return <Briefcase size={24} className="text-slate-600" />;
      case PlaceCategory.Museum: return <Landmark size={24} className="text-rose-600" />;
      default: return <Star size={24} className="text-gray-600" />;
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full z-[1001] animate-in slide-in-from-bottom duration-300">
       {/* Card Container */}
       <div className="bg-white rounded-t-3xl shadow-[0_-5px_25px_-5px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-gray-100">
         
         {/* Drag Handle */}
         <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"></div>

         {/* Header with Title & Close */}
         <div className="flex justify-between items-start mb-4">
           <div>
             <h2 className="text-xl font-bold text-gray-900 leading-tight">{place.name}</h2>
             <p className="text-sm text-gray-500 mt-1">{place.category} {place.subtitle && `• ${place.subtitle}`}</p>
           </div>
           <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
             <X size={20} className="text-gray-500" />
           </button>
         </div>

         {/* Transport Modes Tabs */}
         <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
            <button 
              onClick={() => onRouteClick('driving')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${selectedMode === 'driving' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Car size={16} />
              Drive
            </button>
            <button 
              onClick={() => onRouteClick('walking')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${selectedMode === 'walking' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Footprints size={16} />
              Walk
            </button>
            <button 
              onClick={() => onRouteClick('cycling')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${selectedMode === 'cycling' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Bike size={16} />
              Bike
            </button>
         </div>

         {/* Route Info Stats */}
         <div className="flex items-end gap-2 mb-6">
            {isRouting ? (
               <div className="flex items-center gap-2 text-gray-500 h-10">
                 <Loader2 size={20} className="animate-spin" />
                 <span>Calculating route...</span>
               </div>
            ) : routeDetails ? (
              <>
                <div className="text-3xl font-bold text-gray-900 leading-none">
                  {formatDuration(routeDetails.duration)}
                </div>
                <div className="text-lg text-gray-500 font-medium mb-0.5">
                  ({formatDistance(routeDetails.distance)})
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">Select a mode to see route</div>
            )}
         </div>

         {/* Main Action Buttons */}
         <div className="flex gap-3">
           <button 
             onClick={handleStartNavigation}
             className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
           >
             <Navigation size={18} />
             Start Navigation
           </button>
           <button className="px-5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center active:scale-95 transition-transform">
             <Heart size={20} />
           </button>
         </div>

       </div>
    </div>
  );
};