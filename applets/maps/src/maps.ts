import { Loader } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_MAPS_API_KEY;

interface SerializedPlace {
  name: string | undefined;
  placeId: string | undefined;
  location: { lat: number; lng: number } | undefined;
  address: string | undefined;
  rating: number | undefined;
  userRatingsTotal: number | undefined;
  types: string[] | undefined;
  openNow: boolean | undefined;
  website: string | undefined;
  phoneNumber: string | undefined;
  photoUrl: string | undefined;
}

class MapService {
  private map: google.maps.Map | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private markers: google.maps.Marker[] = [];
  private currentInfoWindow: google.maps.InfoWindow | null = null;
  private googleInstance: typeof google | null = null;
  private readyPromise: Promise<void>;
  private readyResolver!: () => void;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolver = resolve;
    });
    this.initialize();
  }

  private loader = new Loader({
    apiKey: API_KEY,
    version: 'weekly',
    libraries: ['places'],
  });

  private async initialize(): Promise<void> {
    const mapElement = document.getElementById('map');
    if (!mapElement) throw new Error('Map container not found');

    try {
      this.googleInstance = await this.loader.load();
      this.map = new this.googleInstance.maps.Map(mapElement, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });
      this.placesService = new this.googleInstance.maps.places.PlacesService(
        this.map
      );
      this.geocoder = new this.googleInstance.maps.Geocoder();
      console.log('Map, Places service, and Geocoder initialized');
      this.readyResolver();
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      throw error;
    }
  }

  public async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  public async searchLocation(
    location: string,
    query: string
  ): Promise<SerializedPlace[]> {
    await this.waitForReady();
    if (!this.googleInstance) throw new Error('Google Maps not initialized');

    try {
      const coordinates = await this.geocodeLocation(location);
      const results = await this.searchNearby(query, coordinates);
      return this.serializePlaces(results);
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  private geocodeLocation(
    location: string
  ): Promise<google.maps.LatLngLiteral> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder || !this.googleInstance) {
        reject(new Error('Geocoder not initialized'));
        return;
      }
      this.geocoder.geocode({ address: location }, (results, status) => {
        if (
          status === this.googleInstance!.maps.GeocoderStatus.OK &&
          results &&
          results[0]
        ) {
          const { lat, lng } = results[0].geometry.location.toJSON();
          resolve({ lat, lng });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  private searchNearby(
    query: string,
    location: google.maps.LatLngLiteral,
    radius: number = 5000
  ): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.placesService || !this.googleInstance) {
        reject(new Error('Places service not initialized'));
        return;
      }
      const request: google.maps.places.TextSearchRequest = {
        query: query,
        location: location,
        radius: radius,
      };

      this.placesService.textSearch(request, (results, status) => {
        if (
          status === this.googleInstance!.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          resolve(results);
        } else {
          reject(new Error(`Place search failed: ${status}`));
        }
      });
    });
  }

  private serializePlaces(
    results: google.maps.places.PlaceResult[]
  ): SerializedPlace[] {
    return results.map((place) => ({
      name: place.name,
      placeId: place.place_id,
      location: place.geometry?.location?.toJSON(),
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      openNow: place.opening_hours?.open_now,
      website: place.website,
      phoneNumber: place.formatted_phone_number,
      photoUrl:
        place.photos && place.photos.length > 0
          ? place.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 })
          : undefined,
    }));
  }

  public async renderMap(places: SerializedPlace[]): Promise<void> {
    await this.waitForReady();
    if (!this.map || !this.googleInstance) {
      console.error('Map not initialized');
      return;
    }
    this.clearMarkers();
    for (const place of places) {
      this.createMarker(place);
    }
    if (places.length > 0 && places[0].location) {
      this.map.setCenter(places[0].location);
      this.map.setZoom(12);
    }
  }

  private createMarker(place: SerializedPlace): void {
    if (!place.location || !this.map || !this.googleInstance) return;

    const marker = new this.googleInstance.maps.Marker({
      map: this.map,
      position: place.location,
      title: place.name,
    });

    this.markers.push(marker);

    marker.addListener('click', () => {
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
      }
      const infoWindow = this.createInfoWindow(place);
      infoWindow.open(this.map, marker);
      this.currentInfoWindow = infoWindow;
    });
  }

  private createInfoWindow(place: SerializedPlace): google.maps.InfoWindow {
    if (!this.googleInstance) throw new Error('Google Maps not initialized');

    const content = `
      <div style="max-width: 300px; padding: 10px;">
        <h3 style="margin-top: 0;">${place.name}</h3>
        ${place.address ? `<p>${place.address}</p>` : ''}
        ${
          place.rating
            ? `<p>Rating: ${place.rating} ⭐ (${place.userRatingsTotal} reviews)</p>`
            : ''
        }
        ${
          place.openNow !== undefined
            ? `<p>${place.openNow ? 'Open now' : 'Closed'}</p>`
            : ''
        }
        ${
          place.website
            ? `<p><a href="${place.website}" target="_blank">Website</a></p>`
            : ''
        }
        ${place.phoneNumber ? `<p>Phone: ${place.phoneNumber}</p>` : ''}
        ${
          place.photoUrl
            ? `<img src="${place.photoUrl}" style="width: 100%; max-height: 200px; object-fit: cover;">`
            : ''
        }
      </div>
    `;

    return new this.googleInstance.maps.InfoWindow({
      content: content,
      maxWidth: 300,
    });
  }

  private clearMarkers(): void {
    for (const marker of this.markers) {
      marker.setMap(null);
    }
    this.markers = [];
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
    }
  }
}

// Create and export an instance of the MapService
const mapService = new MapService();
export { mapService, SerializedPlace };
