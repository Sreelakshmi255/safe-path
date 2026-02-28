"use client";

import { useEffect, useRef } from "react";

export default function EmergencyListener({ triggerEmergency }) {

  const pressCount = useRef(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "s") {
        pressCount.current++;

        if (pressCount.current >= 5) {
          triggerEmergency();
          pressCount.current = 0;
        }

        setTimeout(() => {
          pressCount.current = 0;
        }, 3000);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return null;
}