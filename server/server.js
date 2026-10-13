import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Room from './models/Room.js';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'Hostel Management API is running' }));
app.get('/api/dashboard', async (_req, res) => {
  try {
    const [students, rooms, occupied] = await Promise.all([Student.countDocuments(), Room.countDocuments(), Student.distinct('roomNumber')]);
    res.json({ totalStudents: students, totalRooms: rooms, occupiedRooms: occupied.length, availableRooms: Math.max(rooms - occupied.length, 0) });
  } catch { res.status(500).json({ message: 'Could not load dashboard' }); }
});
app.get('/api/students', async (_req, res) => {
  try { res.json(await Student.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ message: 'Could not load students' }); }
});
app.post('/api/students', async (req, res) => {
  try {
    const { name, studentId, course, roomNumber } = req.body;
    if (![name, studentId, course, roomNumber].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ message: 'All fields are required' });
    const room = await Room.findOne({ roomNumber: roomNumber.trim() });
    if (!room) return res.status(400).json({ message: 'Room does not exist. Add the room first.' });
    const current = await Student.countDocuments({ roomNumber: roomNumber.trim() });
    if (current >= room.capacity) return res.status(400).json({ message: 'This room is full' });
    res.status(201).json(await Student.create({ name: name.trim(), studentId: studentId.trim(), course: course.trim(), roomNumber: roomNumber.trim() }));
  } catch (e) { res.status(e.code === 11000 ? 409 : 500).json({ message: e.code === 11000 ? 'Student ID already exists' : 'Could not add student' }); }
});
app.delete('/api/students/:id', async (req, res) => {
  try { const item = await Student.findByIdAndDelete(req.params.id); if (!item) return res.status(404).json({ message: 'Student not found' }); res.json({ message: 'Student deleted' }); }
  catch { res.status(400).json({ message: 'Invalid student ID' }); }
});
app.get('/api/rooms', async (_req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    const result = await Promise.all(rooms.map(async r => ({ ...r.toObject(), occupied: await Student.countDocuments({ roomNumber: r.roomNumber }) })));
    res.json(result);
  } catch { res.status(500).json({ message: 'Could not load rooms' }); }
});
app.post('/api/rooms', async (req, res) => {
  try {
    const roomNumber = String(req.body.roomNumber || '').trim();
    const capacity = Number(req.body.capacity);
    if (!roomNumber || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) return res.status(400).json({ message: 'Enter a room number and capacity from 1 to 20' });
    res.status(201).json(await Room.create({ roomNumber, capacity }));
  } catch (e) { res.status(e.code === 11000 ? 409 : 500).json({ message: e.code === 11000 ? 'Room already exists' : 'Could not add room' }); }
});
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (await Student.exists({ roomNumber: room.roomNumber })) return res.status(400).json({ message: 'Cannot delete an occupied room' });
    await room.deleteOne(); res.json({ message: 'Room deleted' });
  } catch { res.status(400).json({ message: 'Invalid room ID' }); }
});
const port = process.env.PORT || 5000;
if (!process.env.MONGODB_URI) { console.error('Missing MONGODB_URI. Create server/.env using .env.example'); process.exit(1); }
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');
  app.listen(port, '0.0.0.0', () => console.log(`API running on http://localhost:${port}`));
} catch (e) { console.error('MongoDB connection failed:', e.message); process.exit(1); }
