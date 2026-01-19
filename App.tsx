
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabView, AppScreenState, User, GeoPoint, Place, TransportMode, RouteDetails } from './types';
import { BottomNav } from './components/BottomNav';
import { DEFAULT_LOCATION, MOCK_PLACES as STATIC_PLACES } from './constants';
import { fetchPlacesInBounds } from './services/overpassService';
import { fetchRoute } from './services/routeService';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { Auth } from './components/Auth';
import { LeafletMap } from './components/LeafletMap';
import { PlaceDetailSheet } from './components/PlaceDetailSheet';
// Added Heart to the imports from lucide-react
import { Locate, Search, LogOut, Loader2, XCircle, Heart } from 'lucide-react';

const App: React.FC = () => {
  // Application Flow State
  const [appState, setAppState] = useState<AppScreenState>('SPLASH');
  const [activeTab, setActiveTab] = useState<TabView>('map');
  
  // User Data State
  const [user, setUser] = useState<User | null>(null);

  // Location & Map Data State
  const [currentLocation, setCurrentLocation] = useState<GeoPoint>(DEFAULT_LOCATION);
  const [places, setPlaces] = useState<Place[]>(STATIC_PLACES);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(14);
  
  // Route State
  const [routeData, setRouteData] = useState<RouteDetails | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');
  const [isRouting, setIsRouting] = useState(false);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Request ID to handle race conditions and debounce
  const requestIdRef = useRef<number>(0);

  // Helper to get location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCurrentLocation(newLocation);
        setRecenterTrigger(prev => prev + 1);
        setIsLocating(false);
      },
      (error) => {
        console.warn("Error getting location:", error.message);
        setIsLocating(false);
        if (places === STATIC_PLACES) {
           setCurrentLocation(DEFAULT_LOCATION);
           setRecenterTrigger(prev => prev + 1);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Handle Map Move / Zoom events
  const handleMapMoveEnd = useCallback((bounds: { south: number, west: number, north: number, east: number }, zoom: number) => {
    setCurrentZoom(zoom);
    const currentRequestId = Date.now();
    requestIdRef.current = currentRequestId;

    // RULE: If zoom is too low, don't even fetch or display
    if (zoom < 15.5) {
      setPlaces([]);
      return;
    }

    // Debounce: Wait 600ms before fetching
    setTimeout(async () => {
      if (requestIdRef.current !== currentRequestId) return;

      setIsLoadingPlaces(true);
      try {
        const fetchedPlaces = await fetchPlacesInBounds(bounds.south, bounds.west, bounds.north, bounds.east);
        
        if (requestIdRef.current === currentRequestId) {
          setPlaces(fetchedPlaces);
        }
      } catch (error) {
        console.error("Error fetching places:", error);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsLoadingPlaces(false);
        }
      }
    }, 600);
  }, []);

  // Filter places based on zoom for a cleaner UI (Google Maps logic)
  const getVisiblePlaces = () => {
    if (currentZoom < 15.5) return []; // Hide everything at low zoom
    
    // At medium zoom, only show high rated places or specific important categories
    if (currentZoom < 17) {
      return places
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 15); // Show top 15 most relevant
    }

    return places; // At high zoom, show everything
  };

  const handleRouteRequest = async (place: Place, mode: TransportMode = 'driving') => {
    setIsRouting(true);
    setTransportMode(mode);
    
    try {
      const details = await fetchRoute(currentLocation, place.location, mode);
      if (details) {
        setRouteData(details);
      } else {
        alert("Could not calculate route.");
        setRouteData(null);
      }
    } catch (e) {
      setRouteData(null);
    } finally {
      setIsRouting(false);
    }
  };

  const handleClearRoute = () => {
    setRouteData(null);
  };

  useEffect(() => {
    handleLocateUser();
    setTimeout(() => setAppState('ONBOARDING'), 2000);
  }, []);

  const handleOnboardingComplete = () => setAppState('AUTH');
  const handleLoginSuccess = (loggedInUser: User) => { setUser(loggedInUser); setAppState('APP'); };
  const handleGuestAccess = () => {
    setUser({
      user_id: 'guest', username: 'Guest User', email: '', is_guest: true,
      created_at: new Date().toISOString(), preferences: { pref_id: 'g', preferred_categories: [], language: 'en' }
    });
    setAppState('APP');
  };

  const handleSignOut = () => { setUser(null); setAppState('AUTH'); setActiveTab('map'); setSelectedPlace(null); setRouteData(null); };

  const handleMarkerClick = (place: Place) => {
    if (!place) {
      setSelectedPlace(null);
    } else {
      setSelectedPlace(place);
      setRouteData(null);
    }
  };

  const renderAppContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="relative w-full h-full bg-[#f8f9fa] flex flex-col">
            <div className="flex-1 relative overflow-hidden">
               <LeafletMap 
                 center={currentLocation} 
                 places={getVisiblePlaces()} 
                 routeCoords={routeData?.coordinates || []}
                 recenterTrigger={recenterTrigger}
                 onMarkerClick={handleMarkerClick}
                 onMapMove={handleMapMoveEnd}
               />

               {isLoadingPlaces && currentZoom >= 15.5 && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-100 z-[1000] flex items-center gap-2">
                   <Loader2 size={14} className="animate-spin text-blue-600" />
                   <span className="text-[11px] font-bold text-gray-700 tracking-tight">UPDATING MAP...</span>
                 </div>
               )}

               {routeData && (
                 <button 
                   onClick={handleClearRoute}
                   className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-xl z-[1000] text-gray-800 hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
                 >
                   <XCircle size={22} className="text-red-500" />
                 </button>
               )}

               {selectedPlace && (
                 <PlaceDetailSheet 
                   place={selectedPlace} 
                   userLocation={currentLocation}
                   onClose={() => { setSelectedPlace(null); setRouteData(null); }}
                   onRouteClick={(mode) => handleRouteRequest(selectedPlace, mode)}
                   isRouting={isRouting}
                   routeDetails={routeData}
                   selectedMode={transportMode}
                 />
               )}

               <button 
                onClick={handleLocateUser}
                disabled={isLocating}
                className={`absolute right-6 z-[1000] p-4 rounded-full shadow-2xl transition-all duration-400 ${
                  selectedPlace ? 'bottom-[380px]' : 'bottom-6'
                } ${
                  isLocating ? 'bg-blue-400' : 'bg-white text-blue-600 border border-gray-100'
                }`}
               >
                 <Locate size={24} className={isLocating ? 'animate-spin' : ''} />
               </button>
            </div>
          </div>
        );
      case 'nearby':
        return (
          <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Discovery</h1>
                <button className="p-2 bg-white rounded-full shadow-sm">
                  <Search size={20} className="text-gray-600"/>
                </button>
             </div>
             
             <div className="space-y-4">
               <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-lg">Nearby Hits</h3>
                    {isLoadingPlaces && <Loader2 size={16} className="animate-spin text-blue-600" />}
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Trending spots in your area.</p>
                  
                  <div className="space-y-3">
                    {places.length === 0 && !isLoadingPlaces && (
                      <div className="p-10 text-center">
                        <p className="text-gray-400 text-sm">Zoom in on the map to find places.</p>
                      </div>
                    )}
                    
                    {places.slice(0, 15).sort((a,b) => (b.rating||0) - (a.rating||0)).map(place => (
                      <div key={place.id} onClick={() => { setActiveTab('map'); setSelectedPlace(place); }} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 active:scale-[0.98] transition-all">
                        <div className="w-14 h-14 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 truncate">{place.name}</h4>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-blue-500 uppercase">{place.category}</span>
                             {place.rating && <span className="text-[10px] font-bold text-amber-500">★ {place.rating.toFixed(1)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
          </div>
        );
      case 'favorites':
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
             <div className="text-center p-8">
               <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                  <Heart size={40} fill="currentColor" />
               </div>
               <h2 className="text-xl font-bold text-gray-800">Your Favorites</h2>
               <p className="text-gray-400 mt-2 text-sm">Saved places will appear here.</p>
             </div>
          </div>
        );
      case 'profile':
        return (
          <div className="flex-1 p-4 bg-gray-50">
             <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 text-center mb-6">
               <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-blue-200">
                 {user?.username.substring(0, 2).toUpperCase()}
               </div>
               <h2 className="text-xl font-extrabold text-gray-900">{user?.username}</h2>
               <p className="text-gray-400 text-sm">{user?.is_guest ? 'Guest Account' : user?.email}</p>
             </div>

             <div className="space-y-3">
               <button className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-700">Account Settings</button>
               <button className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-700">App Preferences</button>
               <button onClick={handleSignOut} className="w-full text-left bg-red-50 p-4 rounded-2xl font-bold text-red-600 flex items-center gap-3">
                 <LogOut size={20} /> Sign Out
               </button>
             </div>
          </div>
        );
      default: return null;
    }
  };

  if (appState === 'SPLASH') return <Splash />;
  if (appState === 'ONBOARDING') return <Onboarding onComplete={handleOnboardingComplete} />;
  if (appState === 'AUTH') return <Auth onLoginSuccess={handleLoginSuccess} onGuestAccess={handleGuestAccess} />;

  return (
    <div className="flex flex-col h-full w-full max-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      <header className="bg-white px-5 py-4 border-b border-gray-50 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs">LG</div>
          <span className="font-black text-xl text-gray-900 tracking-tighter">LocaGuider</span>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {renderAppContent()}
      </main>
      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
