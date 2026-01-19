import { Place, PlaceCategory } from '../types';

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const mapOsmTagToCategory = (tags: any): PlaceCategory => {
  if (tags.amenity === 'cafe') return PlaceCategory.Cafe;
  if (['restaurant', 'fast_food', 'bar', 'pub'].includes(tags.amenity)) return PlaceCategory.Restaurant;
  if (['museum', 'gallery'].includes(tags.tourism)) return PlaceCategory.Museum;
  if (['park', 'garden'].includes(tags.leisure)) return PlaceCategory.Park;
  if (tags.shop) return PlaceCategory.Shopping;
  if (['pharmacy', 'bank', 'atm', 'hospital'].includes(tags.amenity)) return PlaceCategory.Service;
  return PlaceCategory.Other;
};

const getPlaceholderImage = (category: PlaceCategory, id: number | string) => {
  const seed = typeof id === 'number' ? id % 10 : String(id).charCodeAt(0) % 10;
  const baseUrl = "https://images.unsplash.com/";
  const params = "?auto=format&fit=crop&w=400&q=80&random=" + seed;
  
  switch (category) {
    case PlaceCategory.Cafe: return baseUrl + "photo-1509042239860-f550ce710b93" + params;
    case PlaceCategory.Restaurant: return baseUrl + "photo-1517248135467-4c7edcad34c4" + params;
    case PlaceCategory.Shopping: return baseUrl + "photo-1441986300917-64674bd600d8" + params;
    case PlaceCategory.Museum: return baseUrl + "photo-1518998053901-5348d3969105" + params;
    case PlaceCategory.Park: return baseUrl + "photo-1496347646636-ea47f7d6b37b" + params;
    default: return baseUrl + "photo-1467269204594-9661b134dd2b" + params;
  }
};

const executeOverpassQuery = async (query: string): Promise<any> => {
  let lastError;
  for (const server of OVERPASS_SERVERS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); 

      const response = await fetch(server, {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (response.ok) return await response.json();
      if (response.status === 429 || response.status >= 500) continue;
      throw new Error(`Overpass Error: ${response.status}`);
    } catch (error: any) {
      lastError = error;
    }
  }
  throw lastError;
};

export const fetchPlacesInBounds = async (south: number, west: number, north: number, east: number): Promise<Place[]> => {
  // Added a limit of 60 results for faster parsing and less visual noise
  const query = `
    [out:json][timeout:20];
    (
      nwr["amenity"~"cafe|restaurant|fast_food|bar|pub|pharmacy|bank"](${south},${west},${north},${east});
      nwr["shop"~"supermarket|clothes|mall"](${south},${west},${north},${east});
      nwr["tourism"~"museum|attraction"](${south},${west},${north},${east});
      nwr["leisure"~"park"](${south},${west},${north},${east});
    );
    out center tags 60;
  `;

  try {
    const data = await executeOverpassQuery(query);
    if (!data.elements) return [];

    return data.elements
      .filter((element: any) => element.tags && element.tags.name)
      .map((element: any) => {
        const lat = element.type === 'node' ? element.lat : element.center?.lat;
        const lon = element.type === 'node' ? element.lon : element.center?.lon;
        if (!lat || !lon) return null;

        const category = mapOsmTagToCategory(element.tags);
        const elementId = element.id || Math.random();
        let subtitle = element.tags.cuisine || element.tags.amenity || "Point of Interest";

        return {
          id: `${element.type}_${elementId}`,
          name: element.tags.name,
          category: category,
          location: { latitude: lat, longitude: lon },
          description: element.tags.description || element.tags['addr:street'],
          image_url: getPlaceholderImage(category, elementId),
          subtitle: subtitle.charAt(0).toUpperCase() + subtitle.slice(1),
          rating: 3.0 + (Math.random() * 2.0)
        };
      })
      .filter((p: Place | null) => p !== null);
  } catch (error) {
    return [];
  }
};