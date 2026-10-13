# Simple MERN Hostel Management System

A beginner-friendly educational project using React, Express, Node.js and MongoDB Atlas.

## Features
- Dashboard statistics fetched from MongoDB
- Add, list and delete students
- Add, list and delete rooms
- Room capacity checks when assigning students
- Prevent deletion of rooms that have students assigned
- Student ID and room number uniqueness

## Technology Stack
- React and Vite
- Node.js and Express
- MongoDB Atlas and Mongoose

## Run Locally

Start the backend in one terminal:

```bash
cd server
npm install
npm start
```

Start the frontend in a second terminal:

```bash
cd client
npm install
npm run dev
```


Open the Vite URL printed in the client terminal (usually `http://localhost:5173`).

The backend runs at `http://localhost:5000`. Without a MongoDB connection it starts with sample data in temporary in-memory storage. To persist data, create `server/.env` with a `MONGODB_URI` connection string before starting the backend.
