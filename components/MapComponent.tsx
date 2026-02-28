"use client";

import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import socket from "@/lib/socket";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

interface MapComponentProps {
  route?: { lat: number; lng: number }[];
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export default function MapComponent({ route = [], onLocationUpdate }: MapComponentProps) {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    // Add libraries if needed
    libraries: ["places"],
  });

  // Handle geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(coords);
        setLocationError(null);
        if (onLocationUpdate) onLocationUpdate(coords);
        
        // Emit to server
        socket.emit("location-update", {
          userId: "user123",
          coords,
        });
      },
      (error) => {
        console.warn("Error getting location:", error.message);
        setLocationError("Unable to get location. Please enable location permissions.");
        // Use default location on error
        setCurrentLocation(defaultCenter);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(coords);
        setLocationError(null);
        if (onLocationUpdate) onLocationUpdate(coords);
        
        // Emit to server
        socket.emit("location-update", {
          userId: "user123",
          coords,
        });
      },
      (error) => {
        console.warn("Error watching location:", error.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [onLocationUpdate]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle map load error
  if (loadError || mapError) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex flex-col items-center justify-center p-4">
        <div className="text-4xl mb-4">🗺️</div>
        <p className="text-gray-600 font-medium mb-2">Map Unavailable</p>
        <p className="text-sm text-gray-500 text-center">
          {!googleMapsApiKey || googleMapsApiKey === "your_google_maps_api_key_here"
            ? "Please add a valid Google Maps API key to .env.local"
            : "Error loading Google Maps"}
        </p>
        {currentLocation && (
          <p className="text-sm text-green-600 mt-2">
            📍 Location available: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>
        )}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-green-500 rounded-full mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={currentLocation || defaultCenter}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#22c55e",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        )}

        {/* Route Polyline */}
        {route.length > 0 && (
          <Polyline
            path={route}
            options={{
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}

        {/* Route Start/End Markers */}
        {route.length > 0 && (
          <>
            <Marker
              position={route[0]}
              label={{ text: "A", color: "white" }}
            />
            <Marker
              position={route[route.length - 1]}
              label={{ text: "B", color: "white" }}
            />
          </>
        )}
      </GoogleMap>

      {/* Live Indicator */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
        <span className={`w-2 h-2 rounded-full ${locationError ? "bg-gray-400" : "bg-green-500 animate-pulse"}`}></span>
        <span className="text-xs font-medium text-gray-700">
          {locationError ? "Location unavailable" : "Live Tracking"}
        </span>
      </div>

      {/* Location Error Banner */}
      {locationError && (
        <div className="absolute bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-xs text-yellow-700">{locationError}</p>
        </div>
      )}
    </div>
  );
}
