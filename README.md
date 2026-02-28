🛡️ SafePath 🎯
Basic Details

Team Name: CodeCrafters

Team Members

Member 1: Srellakshmi T M -College of engineering Vadakara

Member 2: Malavika Sajith -College of Engineering ,Vadakara



🌐 Hosted Project Link

🔗 https://safe-path-exzr3crrb-sreelakshmis-projects-bb2756a8.vercel.app/

📌 Project Description

SafePath is a real-time personal safety and route monitoring web application built using Next.js.
It tracks user movement during a trip, detects route deviation, and can trigger silent emergency alerts to predefined contacts.

The system ensures safer travel through live location tracking and automated emergency detection.

🚨 Problem Statement

Many people feel unsafe while traveling alone, especially at night or in unfamiliar areas.

There is a lack of:

Real-time route deviation monitoring

Silent emergency triggering

Quick alert systems without manual intervention

💡 The Solution

SafePath solves this by:

Monitoring user route in real-time

Detecting if user deviates from planned path

Showing confirmation popup if drift detected

Triggering emergency alert automatically

Supporting silent key-based emergency trigger

Providing live tracking via WebSockets

🛠 Technical Details
Technologies/Components Used
💻 For Software

Languages Used:

TypeScript

JavaScript

Frameworks Used:

Next.js (App Router)

Node.js (Backend API)

Libraries Used:

geolib (distance calculation)

socket.io (real-time tracking)

dotenv (environment variables)

Tools Used:

VS Code

Git & GitHub

Vercel (Deployment)

Postman (API Testing)

✨ Features
🔹 Feature 1: Route Monitoring

Continuously checks user’s live location against the planned route.

🔹 Feature 2: Drift Detection

If user moves more than 200 meters away from route → confirmation popup appears.

🔹 Feature 3: Silent Emergency Trigger

Press “S” key 5 times to trigger hidden emergency alert.

🔹 Feature 4: Real-Time Live Tracking

Uses Socket.io to broadcast user location instantly.

🔹 Feature 5: Refresh Persistence

Trip data stored in LocalStorage to prevent data loss on refresh.

⚙️ Implementation
For Software
🔧 Installation
npm install
▶️ Run Frontend
npm run dev

Open:

http://localhost:3000
▶️ Run Backend (if separate server)
cd server
npm install
node index.js
📂 Project Structure
safe-path/
│
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── page.tsx
│
├── components/
│
├── server/
│   └── index.js
│
├── .env.local
├── package.json
📸 Project Documentation
Screenshots
🖥 Dashboard View


Shows active trip and monitoring status.

📍 Route Monitoring


Displays route tracking and drift detection.

🚨 Emergency Trigger


Emergency confirmation popup before alert dispatch.

🏗 System Architecture
Architecture Diagram

Frontend (Next.js)
⬇
Route Monitor Logic (geolib)
⬇
Backend API (Node.js + Express)
⬇
Emergency Alert Service

Explanation:

User starts trip

Location monitored continuously

If drift > 200m → popup shown

No response → /api/emergency called

Backend sends emergency alert

🔄 Application Workflow

User starts trip

Trip data saved in LocalStorage

Live tracking begins

Route drift monitored

Emergency triggered if needed

Backend broadcasts alert

🔌 API Documentation
Base URL
http://localhost:5000
🔹 POST /api/emergency
Description:

Triggers emergency alert.

Request Body:
{
  "userId": "12345",
  "location": {
    "lat": 12.9716,
    "lng": 77.5946
  }
}
Response:
{
  "status": "success",
  "message": "Emergency alert sent"
}
🔹 POST /api/location-update
Description:

Receives live user location.

Request Body:
{
  "userId": "12345",
  "coords": {
    "lat": 12.9716,
    "lng": 77.5946
  }
}
🎥 Project Demo
Video

🔗 https://youtu.be/Cv6teedmaMk

Video demonstrates:

Starting a trip

Route monitoring

Drift detection

Silent emergency trigger

Live tracking updates

🤖 AI Tools Used (For Transparency)

Tool Used: ChatGPT

Purpose:

Debugging Next.js setup

Structuring backend API

Designing drift detection logic

README generation

Key Prompts Used:

“Create a location drift detection logic in React”

“Fix Next.js App Router client component error”

“Create emergency API endpoint”

Estimated AI-generated code: ~30%

Human Contributions:

Architecture design

Safety logic planning

UI/UX decisions

Feature integration

Testing and debugging

👥 Team Contributions

Sreelakshmi TM:
Frontend development, UI design, LocalStorage persistence,, documentation,Testing

Malavika Sajith:
Backend API development, emergency logic, WebSocket integration,deployment


📜 License

This project is licensed under the MIT License.

🚀 Deployment
Deploy on Vercel

The easiest way to deploy this Next.js app is via:

🔗 https://vercel.com/new

Follow the deployment instructions in Next.js documentation.
