import React from 'react';
import { Place, PlaceCategory } from '../types';
import { Coffee, Utensils, Calendar, X, Navigation, Heart, Star, ShoppingBag, Briefcase, Landmark } from 'lucide-react';

interface PlaceDetailSheetProps {
  place: Place | null;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number };
}

export const PlaceDetailSheet: React.FC<PlaceDetailSheetProps> = ({ place, onClose, userLocation }) => {
  if (!place) return null;

  // Simple Haversine distance calc for display
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return d > 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
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

  const getBgColor = () => {
    switch (place.category) {
      case PlaceCategory.Cafe: return 'bg-blue-50';
      case PlaceCategory.Restaurant: return 'bg-orange-50';
      case PlaceCategory.Event: return 'bg-purple-50';
      case PlaceCategory.Shopping: return 'bg-teal-50';
      case PlaceCategory.Service: return 'bg-slate-50';
      case PlaceCategory.Museum: return 'bg-rose-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full z-[1001] animate-in slide-in-from-bottom duration-300">
       {/* Card Container */}
       <div className="bg-white rounded-t-3xl shadow-[0_-5px_25px_-5px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-gray-100">
         
         {/* Drag Handle */}
         <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

         {/* Header */}
         <div className="flex justify-between items-start mb-4">
           <div className="flex gap-4">
             <div className={`w-14 h-14 ${getBgColor()} rounded-2xl flex items-center justify-center shadow-sm`}>
                {getIcon()}
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900 leading-tight">{place.name}</h2>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded text-gray-600">{place.category}</span>
                 {place.rating && (
                   <span className="text-xs font-bold text-yellow-500 flex items-center">
                     ★ {place.rating.toFixed(1)}
                   </span>
                 )}
               </div>
             </div>
           </div>
           <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
             <X size={20} className="text-gray-500" />
           </button>
         </div>

         {/* Context Info (Distance & Subtitle) */}
         <div className="flex justify-between items-center mb-6 px-1">
           <div className="text-sm text-gray-500">
             <span className="font-medium text-gray-900">
               {getDistance(userLocation.latitude, userLocation.longitude, place.location.latitude, place.location.longitude)}
             </span> away
           </div>
           {place.subtitle && (
             <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full max-w-[200px] truncate">
               {place.subtitle}
             </div>
           )}
         </div>

         {/* Actions */}
         <div className="flex gap-3">
           <button className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform">
             <Navigation size={18} />
             Route
           </button>
           <button className="px-5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center active:scale-95 transition-transform">
             <Heart size={20} />
           </button>
         </div>

       </div>
    </div>
  );
};