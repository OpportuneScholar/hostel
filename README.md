# StayWise — Simple MERN Hostel Management System

Beginner-friendly educational project using React, Express, Node.js and MongoDB Atlas.

## Features
- Dashboard counts fetched from MongoDB
- Add/list/delete students
- Add/list/delete rooms
- Capacity check when assigning students
- Prevent deletion of a room that has students assigned
- Student ID and room number uniqueness

## Setup in Termux
1. Install Node.js and unzip tools: `pkg update && pkg install nodejs-lts git unzip -y`
2. Unzip the project and enter the folder.
3. In one Termux session:
   - `cd SimpleHostelMERN/server`
   - `npm install`
   - `cp .env.example .env`
   - Edit `.env` and put your MongoDB Atlas connection string in `MONGODB_URI`.
   - `npm start`
4. In a second Termux session:
   - `cd SimpleHostelMERN/client`
   - `npm install`
   - `npm run dev -- --host 0.0.0.0`
5. Open the local URL Vite prints, usually `http://localhost:5173`.

If `localhost:5000` is not reachable from the browser, make sure the server is running. Both frontend and backend are on the same Android device in this setup.

## MongoDB Atlas checklist
- Create a database user and remember its username/password.
- In Network Access, add your current IP address for testing. If you are on a changing mobile network, Atlas access can change; avoid leaving broad access enabled longer than needed.
- Copy the Node.js driver connection string, replace `<password>` with the database user's password, and append a database name, e.g. `/hostel_management?retryWrites=true&w=majority`.
- Keep `.env` private. Never paste the real connection string into chat or commit it to GitHub.

## Viva basics
- React: builds the user interface.
- Node.js: runs JavaScript on the server.
- Express: defines API endpoints such as `GET /api/students` and `POST /api/rooms`.
- MongoDB: stores documents; Mongoose defines schemas and communicates with the database.
- API: a way for frontend and backend to exchange data.
- CRUD: Create, Read, Update, Delete. This project implements Create, Read and Delete for its main records.
- Environment variable: stores configuration like the database connection string outside source code.

This is a learning/demo project, not production-ready software. It has no login or authentication. Use fictional student details for practice.
