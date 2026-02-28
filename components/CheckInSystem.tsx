"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import socket from "@/lib/socket";

interface CheckInSystemProps {
  onEmergency: () => void;
  isActive: boolean;
  checkInInterval?: number;
}

export default function CheckInSystem({ 
  onEmergency, 
  isActive, 
  checkInInterval = 5 
}: CheckInSystemProps) {
  // Use lazy initialization to avoid setState in effect
  const [timeRemaining, setTimeRemaining] = useState(() => checkInInterval * 60);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const onEmergencyRef = useRef(onEmergency);
  const initializedRef = useRef(false);
  
  // Keep ref updated
  useEffect(() => {
    onEmergencyRef.current = onEmergency;
  }, [onEmergency]);

  // Reset timer when trip becomes active - using ref to track initialization
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (isActive && !isPaused) {
      setTimeRemaining(checkInInterval * 60);
      setShowPrompt(false);
    }
  }, [isActive, isPaused]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || isPaused || showPrompt) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setShowPrompt(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, showPrompt]);

  // Auto trigger emergency if no response after prompt
  useEffect(() => {
    if (!showPrompt) return;

    const autoTriggerTimeout = setTimeout(() => {
      setShowPrompt(false);
      onEmergencyRef.current();
    }, 30000);

    return () => clearTimeout(autoTriggerTimeout);
  }, [showPrompt]);

  const handleCheckIn = useCallback(() => {
    setShowPrompt(false);
    setTimeRemaining(checkInInterval * 60);
    setIsPaused(false);
    socket.emit("check-in", { userId: "user123", timestamp: Date.now() });
  }, [checkInInterval]);

  const handleEmergencyTrigger = useCallback(() => {
    setShowPrompt(false);
    onEmergency();
  }, [onEmergency]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isActive) return null;

  return (
    <>
      {/* Check-in Timer Display */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Next Check-in</span>
          <span className={`text-lg font-bold ${timeRemaining <= 30 ? "text-red-500" : "text-gray-800"}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeRemaining <= 30 ? "bg-red-500" : "bg-green-500"
            }`}
            style={{ 
              width: `${(timeRemaining / (checkInInterval * 60)) * 100}%` 
            }}
          />
        </div>

        <button
          onClick={handleCheckIn}
          className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>✓</span> I&apos;m Safe - Check In
        </button>
      </div>

      {/* Emergency Prompt Modal */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Are you safe?
              </h2>
              <p className="text-gray-600 mb-6">
                You haven&apos;t checked in. Tap below to confirm you&apos;re okay, or an emergency alert will be sent automatically.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleCheckIn}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-lg"
                >
                  ✓ I&apos;m Safe
                </button>
                
                <button
                  onClick={handleEmergencyTrigger}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
                >
                  <span>🆘</span> Send Emergency Alert
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Auto-alert will be sent in 30 seconds...
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
