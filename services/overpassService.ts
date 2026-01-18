import { Place, PlaceCategory } from '../types';

// List of available Overpass API servers for failover/load-balancing
// If the main server is busy (429/504), we try the next one.
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',         // Main Instance
  'https://lz4.overpass-api.de/api/interpreter',     // Faster Clone
  'https://overpass.kumi.systems/api/interpreter',   // Community Instance
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter' // Russian Mirror (often reliable)
];

// Helper to map OSM tags to our internal categories
const mapOsmTagToCategory = (tags: any): PlaceCategory => {
  // Food & Drink
  if (tags.amenity === 'cafe') return PlaceCategory.Cafe;
  if (['restaurant', 'fast_food', 'bar', 'pub', 'food_court', 'ice_cream', 'biergarten'].includes(tags.amenity)) return PlaceCategory.Restaurant;
  
  // Tourism / Culture
  if (['museum', 'gallery', 'artwork'].includes(tags.tourism)) return PlaceCategory.Museum;
  if (['park', 'garden', 'playground'].includes(tags.leisure)) return PlaceCategory.Park;
  if (['attraction', 'viewpoint', 'memorial'].includes(tags.tourism) || tags.historic) return PlaceCategory.Historical;
  
  // Shopping
  if (tags.shop) return PlaceCategory.Shopping;

  // Services
  if (['pharmacy', 'bank', 'post_office', 'atm', 'clinic', 'dentist', 'hospital', 'doctors'].includes(tags.amenity)) return PlaceCategory.Service;

  return PlaceCategory.Other;
};

// Helper to get a random image based on category
const getPlaceholderImage = (category: PlaceCategory, id: number | string) => {
  const seed = typeof id === 'number' ? id % 10 : String(id).charCodeAt(0) % 10;
  
  switch (category) {
    case PlaceCategory.Cafe:
      return `https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80&random=${seed}`;
    case PlaceCategory.Restaurant:
      return `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80&random=${seed}`;
    case PlaceCategory.Shopping:
      return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80&random=${seed}`;
    case PlaceCategory.Service:
      return `https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=400&q=80&random=${seed}`;
    case PlaceCategory.Museum:
      return `https://images.unsplash.com/photo-1518998053901-5348d3969105?auto=format&fit=crop&w=400&q=80&random=${seed}`;
    case PlaceCategory.Park:
      return `https://images.unsplash.com/photo-1496347646636-ea47f7d6b37b?auto=format&fit=crop&w=400&q=80&random=${seed}`;
    case PlaceCategory.Historical:
      return `https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=400&q=80&random=${seed}`;
    default:
      return `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80`;
  }
};

// Robust fetch function with failover
const executeOverpassQuery = async (query: string): Promise<any> => {
  let lastError;

  for (const server of OVERPASS_SERVERS) {
    try {
      // 10-second client-side timeout to fail fast and switch servers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 

      const response = await fetch(server, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }

      // If rate limited (429) or server error (5xx), we try the next server
      if (response.status === 429 || response.status >= 500) {
        console.warn(`Overpass server ${server} busy/error (${response.status}). Trying next...`);
        continue;
      }
      
      throw new Error(`Overpass API Error: ${response.status} ${response.statusText}`);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`Timeout requesting ${server}. Trying next...`);
      } else {
        console.warn(`Failed to fetch from ${server}:`, error);
      }
      lastError = error;
      // Loop continues to next server
    }
  }

  throw lastError || new Error("All Overpass servers are currently unreachable. Please check your connection.");
};

export const fetchPlacesInBounds = async (south: number, west: number, north: number, east: number): Promise<Place[]> => {
  // Construct Overpass QL Query with BBOX
  // Increased QL timeout to 25s for reliability on mobile networks
  const query = `
    [out:json][timeout:25];
    (
      nwr["amenity"~"cafe|restaurant|fast_food|bar|pub|pharmacy|bank|hospital"](${south},${west},${north},${east});
      nwr["shop"](${south},${west},${north},${east});
      nwr["tourism"~"museum|attraction|gallery"](${south},${west},${north},${east});
      nwr["leisure"~"park|garden"](${south},${west},${north},${east});
    );
    out center tags;
  `;

  try {
    const data = await executeOverpassQuery(query);
    
    if (!data.elements) return [];

    // Parse OSM elements
    const places: Place[] = data.elements
      .filter((element: any) => element.tags && element.tags.name) // Filter out unnamed places
      .map((element: any) => {
        // Handle coordinate differences between nodes and ways/relations
        const lat = element.type === 'node' ? element.lat : element.center?.lat;
        const lon = element.type === 'node' ? element.lon : element.center?.lon;

        if (!lat || !lon) return null;

        const category = mapOsmTagToCategory(element.tags);
        const elementId = element.id || Math.random().toString(36).substr(2, 9);

        // Enhance subtitle based on tags
        let subtitle = element.tags.opening_hours ? 'Check hours' : undefined;
        if (element.tags.cuisine) subtitle = `${element.tags.cuisine} • ${subtitle || ''}`;
        else if (element.tags.shop) subtitle = `${element.tags.shop} Store`;
        else if (element.tags.amenity) subtitle = element.tags.amenity.charAt(0).toUpperCase() + element.tags.amenity.slice(1);

        return {
          id: `${element.type}_${elementId}`,
          name: element.tags.name,
          category: category,
          location: {
            latitude: lat,
            longitude: lon
          },
          description: element.tags.description || element.tags['addr:street'] || undefined,
          image_url: getPlaceholderImage(category, elementId),
          subtitle: subtitle,
          rating: 3.5 + (Math.random() * 1.5) // Simulated rating
        };
      })
      .filter((p: Place | null) => p !== null);

    return places;
  } catch (error) {
    console.error("Final failure to fetch places:", error);
    // Return empty array to allow UI to handle it gracefully
    return [];
  }
};