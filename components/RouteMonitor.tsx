"use client";

import { useEffect, useRef, useCallback } from "react";
import { getDistance } from "geolib";

interface Props {
  route: { latitude: number; longitude: number }[];
  triggerEmergency: () => void;
  isActive: boolean;
}

export default function RouteMonitor({ route, triggerEmergency, isActive }: Props) {
  const watchIdRef = useRef<number | null>(null);
  const hasAlertedRef = useRef(false);

  const handleDrift = useCallback(() => {
    if (hasAlertedRef.current) return;
    hasAlertedRef.current = true;

    // Emit drift event via socket or handle directly
    console.log("Route drift detected!");

    // Trigger emergency after 15 seconds if no response
    setTimeout(() => {
      triggerEmergency();
      hasAlertedRef.current = false;
    }, 15000);
  }, [triggerEmergency]);

  useEffect(() => {
    if (!isActive || route.length === 0) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    hasAlertedRef.current = false;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Find nearest route point
        let minDistance = Infinity;

        route.forEach((point) => {
          const distance = getDistance(currentLocation, point);
          if (distance < minDistance) {
            minDistance = distance;
          }
        });

        // If more than 200 meters off route, trigger alert
        if (minDistance > 200) {
          handleDrift();
        }
      },
      (error) => console.error("Error watching position:", error),
      { enableHighAccuracy: true, timeout: 5000 }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [route, isActive, handleDrift]);

  return null;
}
