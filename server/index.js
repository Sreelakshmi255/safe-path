require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const twilio = require("twilio");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// In-memory storage (NO DATABASE)
const activeTrips = {};
const emergencyEvents = [];
const emergencyContacts = {};

// Twilio setup
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Test route
app.get("/", (req, res) => {
  res.send("🚀 SafePath Backend Running");
});

// Get all emergency events
app.get("/api/emergencies", (req, res) => {
  res.json(emergencyEvents);
});

// Emergency route
app.post("/api/emergency", async (req, res) => {
  const { location, contactNumber, userId } = req.body;

  try {
    await client.messages.create({
      body: `🚨 Emergency! Live location: ${location}`,
      from: process.env.TWILIO_PHONE,
      to: contactNumber,
    });

    // Log emergency event
    emergencyEvents.push({
      userId,
      location,
      contactNumber,
      timestamp: Date.now(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save emergency contacts
app.post("/api/contacts", (req, res) => {
  const { userId, contacts } = req.body;
  emergencyContacts[userId] = contacts;
  res.json({ success: true });
});

// Get emergency contacts
app.get("/api/contacts/:userId", (req, res) => {
  const { userId } = req.params;
  res.json(emergencyContacts[userId] || []);
});

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join user to their room
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Location update
  socket.on("location-update", (data) => {
    const { userId, coords } = data;
    activeTrips[userId] = {
      ...activeTrips[userId],
      location: coords,
      lastUpdate: Date.now(),
    };
    
    // Broadcast to all connected clients (for demo)
    io.emit("location-update", { userId, coords });
  });

  // Start trip
  socket.on("start-trip", (data) => {
    const { userId, destination, route } = data;
    activeTrips[userId] = {
      destination,
      route,
      startTime: Date.now(),
      status: "active",
    };
    io.emit("trip-started", { userId, destination });
  });

  // End trip
  socket.on("end-trip", (data) => {
    const { userId } = data;
    if (activeTrips[userId]) {
      activeTrips[userId].status = "ended";
      activeTrips[userId].endTime = Date.now();
    }
    io.emit("trip-ended", { userId });
  });

  // Check-in
  socket.on("check-in", (data) => {
    const { userId, timestamp } = data;
    if (activeTrips[userId]) {
      activeTrips[userId].lastCheckIn = timestamp;
    }
    io.emit("check-in-confirmed", { userId, timestamp });
  });

  // Emergency trigger
  socket.on("emergency-trigger", async (data) => {
    const { userId, location, contacts } = data;
    
    // Send SMS to all contacts
    for (const contact of contacts || []) {
      try {
        await client.messages.create({
          body: `🚨 EMERGENCY ALERT! User needs help. Location: ${location}`,
          from: process.env.TWILIO_PHONE,
          to: contact.phone,
        });
      } catch (error) {
        console.error("Failed to send emergency SMS:", error);
      }
    }

    // Broadcast emergency to all clients
    io.emit("emergency-alert", { userId, location, timestamp: Date.now() });
  });

  // Route drift detected
  socket.on("route-drift", (data) => {
    const { userId, deviation } = data;
    io.emit("route-drift-alert", { userId, deviation, timestamp: Date.now() });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
