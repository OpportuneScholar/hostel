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

## Run the Backend
Open a Termux session:

```bash
cd ~/SimpleHostelMERN/server
npm install
npm start
cd ~/SimpleHostelMERN/client
npm install
npm run dev
