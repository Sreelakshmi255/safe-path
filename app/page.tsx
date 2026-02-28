"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import CheckInSystem from "@/components/CheckInSystem";
import EmergencyListener from "@/components/EmergencyButton";

// Dynamic import for MapComponent (no SSR for Google Maps)
const DynamicMap = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 bg-green-500 rounded-full mb-2"></div>
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

interface Trip {
  id: string;
  destination: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  route: { lat: number; lng: number }[];
  startTime: number;
}

interface EmergencyContact {
  name: string;
  phone: string;
}

export default function Dashboard() {
  // Use lazy initialization for state that depends on browser APIs
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Use lazy initialization to detect client-side (avoids hydration mismatch)
  const [isMounted] = useState(() => typeof window !== 'undefined');

  // Load saved trip on mount (client-side only)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const savedTrip = localStorage.getItem("trip");
    if (savedTrip) {
      setTrip(JSON.parse(savedTrip));
    }

    // Load saved contacts
    const savedContacts = localStorage.getItem("emergencyContacts");
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
  }, []);

  // Save contacts to localStorage
  const saveContacts = (newContacts: EmergencyContact[]) => {
    setContacts(newContacts);
    localStorage.setItem("emergencyContacts", JSON.stringify(newContacts));
  };

  // Add emergency contact
  const addContact = () => {
    if (newContact.name && newContact.phone) {
      saveContacts([...contacts, newContact]);
      setNewContact({ name: "", phone: "" });
      toast.success("Emergency contact added!");
    }
  };

  // Remove emergency contact
  const removeContact = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    saveContacts(updated);
    toast.success("Contact removed");
  };

  // Start a new trip
  const startTrip = async (destination: string) => {
    setIsLoading(true);
    
    // Get current location
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const startLoc = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    // Create a simple route (in real app, use Google Directions API)
    const endLoc = {
      lat: startLoc.lat + 0.01,
      lng: startLoc.lng + 0.01,
    };

    const route = [startLoc, endLoc];

    const newTrip: Trip = {
      id: Date.now().toString(),
      destination,
      startLocation: startLoc,
      endLocation: endLoc,
      route,
      startTime: Date.now(),
    };

    setTrip(newTrip);
    localStorage.setItem("trip", JSON.stringify(newTrip));
    setIsLoading(false);
    toast.success(`Trip to ${destination} started!`);
  };

  // End trip
  const endTrip = () => {
    setTrip(null);
    localStorage.removeItem("trip");
    toast.success("Trip ended");
  };

  // Handle emergency trigger
  const handleEmergency = useCallback(async () => {
    if (contacts.length === 0) {
      toast.error("No emergency contacts configured!");
      setShowEmergencyModal(true);
      return;
    }

    const location = currentLocation 
      ? `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`
      : "Location unavailable";

    toast.error("EMERGENCY ALERT SENT!");
    
    // Send SMS to all contacts
    let successCount = 0;
    let failCount = 0;
    
    for (const contact of contacts) {
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/emergency`, {
          location,
          contactNumber: contact.phone,
          userId: "user123",
        });
        successCount++;
      } catch (error: any) {
        failCount++;
        console.error(`Failed to send to ${contact.phone}:`, error.response?.data || error.message);
      }
    }

    // Show result feedback
    if (failCount === 0) {
      toast.success(`Alerts sent to ${successCount} contact(s)!`);
    } else {
      toast.error(`Sent: ${successCount}, Failed: ${failCount}`);
    }

    setShowEmergencyModal(true);
  }, [contacts, currentLocation]);

  // Button text constants to avoid hydration mismatch
  const buttonTexts = {
    airport: isMounted ? "🏢 Go to Airport" : "Go to Airport",
    home: isMounted ? "🏠 Go to Home" : "Go to Home",
    work: isMounted ? "💼 Go to Work" : "Go to Work",
    addContact: isMounted ? "+ Add Contact" : "+ Add Contact",
    emergency: isMounted ? "🚨 SEND EMERGENCY ALERT" : "SEND EMERGENCY ALERT",
  };

  // Handle route drift
  const handleDrift = () => {
    toast.custom((t) => (
      <div className={`${t.visible ? "animate-bounce" : ""} bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg`}>
        <p className="font-bold text-lg">⚠️ Route Deviation Detected!</p>
        <p>You seem to be off the planned route.</p>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-center" />
      
      {/* Emergency Listener (secret trigger) */}
      <EmergencyListener triggerEmergency={handleEmergency} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">SafePath</h1>
              <p className="text-xs text-gray-500">Your Safety Companion</p>
            </div>
          </div>
          
          {trip && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-600">Trip Active</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Trip Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Trip Control</h2>
              
              {!trip ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">Start a trip to enable safety features</p>
                  <button
                    onClick={() => startTrip("Airport")}
                    disabled={isLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    {isLoading ? "Starting..." : buttonTexts.airport}
                  </button>
                  <button
                    onClick={() => startTrip("Home")}
                    disabled={isLoading}
                    className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    {isLoading ? "Starting..." : buttonTexts.home}
                  </button>
                  <button
                    onClick={() => startTrip("Work")}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    {isLoading ? "Starting..." : buttonTexts.work}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="text-lg font-bold text-gray-800">{trip.destination}</p>
                  </div>
                  <button
                    onClick={endTrip}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    End Trip
                  </button>
                </div>
              )}
            </div>

            {/* Check-in System */}
            {trip && (
              <CheckInSystem 
                onEmergency={handleEmergency} 
                isActive={!!trip}
                checkInInterval={5}
              />
            )}

            {/* Emergency Contacts */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Emergency Contacts</h2>
              
              <div className="space-y-3 mb-4">
                {contacts.length === 0 ? (
                  <p className="text-sm text-gray-500">No emergency contacts added</p>
                ) : (
                  contacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-800">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                      </div>
                      <button
                        onClick={() => removeContact(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        X
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={addContact}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {buttonTexts.addContact}
                </button>
              </div>
            </div>

            {/* Secret Emergency Button */}
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h2 className="text-lg font-bold text-red-800 mb-2">Quick Emergency</h2>
              <p className="text-sm text-red-600 mb-4">
                Tap the button below or press <kbd className="bg-red-200 px-2 py-1 rounded">S</kbd> 5 times quickly
              </p>
              <button
                onClick={handleEmergency}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-xl transition-colors text-lg animate-pulse"
              >
                {buttonTexts.emergency}
              </button>
            </div>
          </div>

          {/* Right Column - Map & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Live Location</h2>
              <DynamicMap 
                route={trip?.route || []}
                onLocationUpdate={setCurrentLocation}
              />
            </div>

            {/* Safety Tips */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <h2 className="text-lg font-bold mb-3">Safety Tips</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Share your trip status with trusted contacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Check in regularly during your journey</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Press "S" key 5 times quickly for silent emergency</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Stay on the marked route for maximum safety</span>
                </li>
              </ul>
            </div>

            {/* Trip Status */}
            {trip && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Trip Status</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-xl font-bold text-blue-600">Active</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Safety</p>
                    <p className="text-xl font-bold text-green-600">Protected</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Contacts Notified</p>
                    <p className="text-xl font-bold text-purple-600">{contacts.length}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Check-ins</p>
                    <p className="text-xl font-bold text-orange-600">Auto</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">!</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Emergency Alert Sent!</h2>
            <p className="text-gray-600 mb-6">
              Your emergency contacts have been notified with your live location. 
              Stay calm and seek help.
            </p>
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
