import { GeoPoint, TransportMode, RouteDetails } from '../types';

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

/**
 * Fetches a route between two points using OSRM.
 * Returns coordinates, distance (meters), and duration (seconds).
 */
export const fetchRoute = async (
  start: GeoPoint, 
  end: GeoPoint, 
  mode: TransportMode = 'driving'
): Promise<RouteDetails | null> => {
  try {
    // Map internal mode to OSRM profile
    let profile = 'driving';
    if (mode === 'walking') profile = 'walking';
    if (mode === 'cycling') profile = 'cycling';

    // OSRM expects coordinates in "longitude,latitude" format
    const url = `${OSRM_BASE_URL}/${profile}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) {
      if (profile !== 'driving') {
        return fetchRoute(start, end, 'driving');
      }
      throw new Error('Failed to fetch route');
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];

    // OSRM returns GeoJSON coordinates [lon, lat], but Leaflet needs [lat, lon]
    // Filter out potential 0,0 points to avoid map jumping to Atlantic Ocean
    const coordinates = route.geometry.coordinates
      .map((coord: number[]) => [coord[1], coord[0]])
      .filter((coord: number[]) => coord[0] !== 0 && coord[1] !== 0);
    
    if (coordinates.length < 2) return null;

    return {
      coordinates,
      distance: route.distance, // meters
      duration: route.duration  // seconds
    };

  } catch (error) {
    console.error("Route service error:", error);
    return null;
  }
};