import { Place, GeoPoint, Event, PlaceCategory } from './types';

// Default location (Izmir, Turkey based on project context)
export const DEFAULT_LOCATION = {
  latitude: 38.4237,
  longitude: 27.1428
};

// Fallback static data in case API fails or for initial load before location
export const MOCK_PLACES: Place[] = [
  {
    id: 'static_1',
    name: 'Alsancak Dostlar Fırını',
    category: PlaceCategory.Restaurant,
    location: { latitude: 38.4385, longitude: 27.1415 },
    description: 'Famous for traditional Boyoz.',
    rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93'
  }
];

// Events are not yet pulled from an API in this phase, so we keep mock events
export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Izmir Jazz Festival',
    category: 'Music',
    start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end_time: new Date(Date.now() + 90000000).toISOString(),
    location: { latitude: 38.4250, longitude: 27.1400 },
    description: 'Annual jazz festival featuring local artists.'
  }
];