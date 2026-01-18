import { GeoPoint, Place, PlaceCategory } from '../types';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const RADIUS = 5000; // 5km radius

// Helper to map OSM tags to our internal categories
const mapOsmTagToCategory = (tags: any): PlaceCategory => {
  // Food & Drink
  if (tags.amenity === 'cafe') return PlaceCategory.Cafe;
  if (['restaurant', 'fast_food', 'bar', 'pub', 'food_court', 'ice_cream'].includes(tags.amenity)) return PlaceCategory.Restaurant;
  
  // Tourism / Culture
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return PlaceCategory.Museum;
  if (tags.leisure === 'park' || tags.leisure === 'garden') return PlaceCategory.Park;
  
  // Shopping
  if (tags.shop) return PlaceCategory.Shopping;

  // Services
  if (['bank', 'post_office', 'atm', 'clinic', 'dentist'].includes(tags.amenity)) return PlaceCategory.Service;

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
    default:
      return `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80`;
  }
};

export const fetchNearbyPlaces = async (center: GeoPoint): Promise<Place[]> => {
  // Construct Overpass QL Query
  // Added nwr for fast_food, bar, bank and all shops
  const query = `
    [out:json][timeout:90];
    (
      nwr["amenity"~"cafe|restaurant|fast_food|bar|bank"](around:${RADIUS},${center.latitude},${center.longitude});
      nwr["shop"](around:${RADIUS},${center.latitude},${center.longitude});
      nwr["tourism"="museum"](around:${RADIUS},${center.latitude},${center.longitude});
    );
    out center tags;
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 95000);

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 504 || response.status === 503) {
        throw new Error("Overpass API is currently busy or timed out.");
      }
      throw new Error(`Overpass API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
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

        // Enhance subtitle based on specific tags
        let subtitle = element.tags.opening_hours ? 'Check opening hours' : undefined;
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
          description: element.tags.description || undefined,
          image_url: getPlaceholderImage(category, elementId),
          subtitle: subtitle,
          rating: 3.0 + (Math.random() * 2.0) // Demo rating 3.0-5.0
        };
      })
      .filter((p: Place | null) => p !== null);

    return places;
  } catch (error) {
    console.error("Failed to fetch places:", error);
    return [];
  }
};