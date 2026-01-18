import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabView, AppScreenState, User, GeoPoint, Place } from './types';
import { BottomNav } from './components/BottomNav';
import { DEFAULT_LOCATION, MOCK_PLACES as STATIC_PLACES } from './constants';
import { fetchPlacesInBounds } from './services/overpassService';
import { Splash } from './components/Splash';
import { Onboarding } from './components/Onboarding';
import { Auth } from './components/Auth';
import { LeafletMap } from './components/LeafletMap';
import { PlaceDetailSheet } from './components/PlaceDetailSheet';
import { Navigation, Locate, Calendar, Search, LogOut, Loader2 } from 'lucide-react';

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
        // Note: We do NOT fetch places here. The map will move, triggering handleMapMoveEnd.
      },
      (error) => {
        console.warn("Error getting location:", error.message);
        setIsLocating(false);
        // Fallback: Just ensure we are at default or stay put.
        // User can manually move map to trigger fetch.
        if (places === STATIC_PLACES) {
           setCurrentLocation(DEFAULT_LOCATION);
           setRecenterTrigger(prev => prev + 1);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Handle Map Move / Zoom events with Debounce and Logic
  const handleMapMoveEnd = useCallback((bounds: { south: number, west: number, north: number, east: number }, zoom: number) => {
    const currentRequestId = Date.now();
    requestIdRef.current = currentRequestId;

    // RULE: If zoom < 14, clear POIs (Performance & UX)
    if (zoom < 14) {
      setPlaces([]);
      return;
    }

    // Debounce: Wait 700ms before fetching
    setTimeout(async () => {
      // If a new request started during this wait, ignore this one
      if (requestIdRef.current !== currentRequestId) return;

      setIsLoadingPlaces(true);
      try {
        const fetchedPlaces = await fetchPlacesInBounds(bounds.south, bounds.west, bounds.north, bounds.east);
        
        // Check again before updating state
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
    }, 700);
  }, []);

  // Initialize App
  useEffect(() => {
    const initApp = async () => {
      handleLocateUser();
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAppState('ONBOARDING');
    };

    initApp();
  }, []);

  const handleOnboardingComplete = () => {
    setAppState('AUTH');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setAppState('APP');
  };

  const handleGuestAccess = () => {
    setUser({
      user_id: 'guest',
      username: 'Guest User',
      email: '',
      is_guest: true,
      created_at: new Date().toISOString(),
      preferences: { pref_id: 'guest_pref', preferred_categories: [], language: 'en' }
    });
    setAppState('APP');
  };

  const handleSignOut = () => {
    setUser(null);
    setAppState('AUTH');
    setActiveTab('map'); 
    setSelectedPlace(null);
  };

  const handleMarkerClick = (place: Place) => {
    if (!place) {
      setSelectedPlace(null);
    } else {
      setSelectedPlace(place);
    }
  };

  // Main App Content Renderer
  const renderAppContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="relative w-full h-full bg-slate-100 flex flex-col">
            <div className="flex-1 relative overflow-hidden">
               {/* Leaflet Map Integration */}
               <LeafletMap 
                 center={currentLocation} 
                 places={places} 
                 recenterTrigger={recenterTrigger}
                 onMarkerClick={handleMarkerClick}
                 onMapMove={handleMapMoveEnd}
               />

               {/* Loading Indicator for Places */}
               {isLoadingPlaces && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md z-[1000] flex items-center gap-2">
                   <Loader2 size={16} className="animate-spin text-blue-600" />
                   <span className="text-xs font-medium text-gray-700">Finding nearby places...</span>
                 </div>
               )}

               {/* Place Detail Sheet Overlay */}
               {selectedPlace && (
                 <PlaceDetailSheet 
                   place={selectedPlace} 
                   userLocation={currentLocation}
                   onClose={() => setSelectedPlace(null)}
                 />
               )}

               {/* Floating Action Button for Location */}
               <button 
                onClick={handleLocateUser}
                disabled={isLocating}
                className={`absolute right-6 z-[1000] p-4 rounded-full shadow-lg transition-all duration-300 ${
                  selectedPlace ? 'bottom-64' : 'bottom-6'
                } ${
                  isLocating ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
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
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Nearby Places</h3>
                    {isLoadingPlaces && <Loader2 size={16} className="animate-spin text-blue-600" />}
                  </div>
                  <p className="text-gray-500 text-sm">Best places around you.</p>
                  
                  <div className="mt-4 space-y-2">
                    {/* Render fetched places */}
                    {places.length === 0 && !isLoadingPlaces && (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        {places.length === 0 ? "Move the map to find places." : "No places found nearby."}
                      </div>
                    )}
                    
                    {places.slice(0, 10).map(place => (
                      <div key={place.id} onClick={() => { setActiveTab('map'); setSelectedPlace(place); }} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                          <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm line-clamp-1">{place.name}</h4>
                          <span className="text-xs text-blue-600">{place.category}</span>
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
               <h2 className="text-xl font-semibold text-gray-700">Your Favorites</h2>
               <p className="text-gray-500 mt-2">Save places and events to access them quickly.</p>
               {user?.is_guest && (
                 <p className="text-xs text-orange-500 mt-4 bg-orange-50 p-2 rounded">
                   Sign in to sync your favorites across devices.
                 </p>
               )}
             </div>
          </div>
        );
      case 'profile':
        return (
          <div className="flex-1 p-4 bg-gray-50">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center mb-6">
               <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 text-xl font-bold mb-4">
                 {user?.username.substring(0, 2).toUpperCase()}
               </div>
               <h2 className="text-xl font-bold">{user?.username}</h2>
               <p className="text-gray-500">{user?.is_guest ? 'Guest Account' : user?.email}</p>
             </div>

             <div className="space-y-2">
               <button className="w-full text-left bg-white p-4 rounded-lg shadow-sm border border-gray-100 font-medium text-gray-700">
                 Preferences
               </button>
               <button className="w-full text-left bg-white p-4 rounded-lg shadow-sm border border-gray-100 font-medium text-gray-700">
                 Language Settings
               </button>
               <button 
                onClick={handleSignOut}
                className="w-full text-left bg-red-50 p-4 rounded-lg shadow-sm border border-red-100 font-medium text-red-600 flex items-center gap-2"
               >
                 <LogOut size={18} />
                 Sign Out
               </button>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Root Render Logic
  if (appState === 'SPLASH') {
    return <Splash />;
  }

  if (appState === 'ONBOARDING') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (appState === 'AUTH') {
    return <Auth onLoginSuccess={handleLoginSuccess} onGuestAccess={handleGuestAccess} />;
  }

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      <header className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            LG
          </div>
          <span className="font-bold text-lg text-gray-800 tracking-tight">LocaGuider</span>
        </div>
        <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-md">
          {user?.is_guest ? 'Guest' : 'Online'}
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