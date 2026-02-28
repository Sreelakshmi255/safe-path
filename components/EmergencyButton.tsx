"use client";

import { useEffect, useRef } from "react";

type EmergencyListenerProps = {
  triggerEmergency: () => void;
};

export default function EmergencyListener({
  triggerEmergency,
}: EmergencyListenerProps) {

  const pressCount = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s") {
        pressCount.current++;

        if (pressCount.current >= 5) {
          triggerEmergency();
          pressCount.current = 0;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [triggerEmergency]);

  return null;
}