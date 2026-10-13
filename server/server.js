import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import Student from './models/Student.js';
import Room from './models/Room.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
let useMemoryStore = false;

const demoRooms = [
  { _id: 'room-101', roomNumber: 'A-101', capacity: 2 },
  { _id: 'room-102', roomNumber: 'A-102', capacity: 2 },
  { _id: 'room-201', roomNumber: 'B-201', capacity: 4 },
  { _id: 'room-202', roomNumber: 'B-202', capacity: 3 },
];

const demoStudents = [
  { _id: 'student-1', name: 'Amaan Khan', studentId: 'STU-24018', course: 'B.Tech CSE', roomNumber: 'A-101' },
  { _id: 'student-2', name: 'Priya Sharma', studentId: 'STU-24022', course: 'BBA', roomNumber: 'A-101' },
  { _id: 'student-3', name: 'Rahul Verma', studentId: 'STU-24035', course: 'B.Com', roomNumber: 'B-201' },
  { _id: 'student-4', name: 'Sara Ali', studentId: 'STU-24041', course: 'B.Sc Nursing', roomNumber: 'B-201' },
];

let memoryRooms = demoRooms.map((room) => ({ ...room, createdAt: new Date() }));
let memoryStudents = demoStudents.map((student) => ({ ...student, createdAt: new Date() }));

app.use(cors());
app.use(express.json());

const getOccupiedCount = (roomNumber) => memoryStudents.filter((student) => student.roomNumber === roomNumber).length;

const roomPayload = (room) => ({ ...room, occupied: getOccupiedCount(room.roomNumber) });

app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'Hostel Management API is running' }));

app.get('/api/dashboard', async (_req, res) => {
  try {
    if (useMemoryStore) {
      const rooms = memoryRooms.map(roomPayload);
      const occupiedRooms = rooms.filter((room) => room.occupied > 0).length;
      const availableRooms = rooms.filter((room) => room.occupied < room.capacity).length;
      return res.json({ totalStudents: memoryStudents.length, totalRooms: memoryRooms.length, occupiedRooms, availableRooms });
    }

    const [students, rooms, occupied] = await Promise.all([
      Student.countDocuments(),
      Room.countDocuments(),
      Student.distinct('roomNumber'),
    ]);

    return res.json({
      totalStudents: students,
      totalRooms: rooms,
      occupiedRooms: occupied.length,
      availableRooms: Math.max(rooms - occupied.length, 0),
    });
  } catch {
    return res.status(500).json({ message: 'Could not load dashboard' });
  }
});

app.get('/api/students', async (_req, res) => {
  try {
    if (useMemoryStore) return res.json(memoryStudents);
    return res.json(await Student.find().sort({ createdAt: -1 }));
  } catch {
    return res.status(500).json({ message: 'Could not load students' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, studentId, course, roomNumber } = req.body;
    if (![name, studentId, course, roomNumber].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const cleanedName = name.trim();
    const cleanedStudentId = studentId.trim();
    const cleanedCourse = course.trim();
    const cleanedRoomNumber = roomNumber.trim();

    if (useMemoryStore) {
      const room = memoryRooms.find((item) => item.roomNumber === cleanedRoomNumber);
      if (!room) return res.status(400).json({ message: 'Room does not exist. Add the room first.' });
      const current = getOccupiedCount(cleanedRoomNumber);
      if (current >= room.capacity) return res.status(400).json({ message: 'This room is full' });
      if (memoryStudents.some((student) => student.studentId.toLowerCase() === cleanedStudentId.toLowerCase())) {
        return res.status(409).json({ message: 'Student ID already exists' });
      }

      const student = {
        _id: randomUUID(),
        name: cleanedName,
        studentId: cleanedStudentId,
        course: cleanedCourse,
        roomNumber: cleanedRoomNumber,
        createdAt: new Date(),
      };
      memoryStudents = [student, ...memoryStudents];
      return res.status(201).json(student);
    }

    const room = await Room.findOne({ roomNumber: cleanedRoomNumber });
    if (!room) return res.status(400).json({ message: 'Room does not exist. Add the room first.' });
    const current = await Student.countDocuments({ roomNumber: cleanedRoomNumber });
    if (current >= room.capacity) return res.status(400).json({ message: 'This room is full' });

    const student = await Student.create({
      name: cleanedName,
      studentId: cleanedStudentId,
      course: cleanedCourse,
      roomNumber: cleanedRoomNumber,
    });
    return res.status(201).json(student);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Student ID already exists' });
    }
    return res.status(500).json({ message: 'Could not add student' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    if (useMemoryStore) {
      const originalCount = memoryStudents.length;
      memoryStudents = memoryStudents.filter((student) => student._id !== req.params.id);
      if (memoryStudents.length === originalCount) return res.status(404).json({ message: 'Student not found' });
      return res.json({ message: 'Student deleted' });
    }

    const item = await Student.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Student not found' });
    return res.json({ message: 'Student deleted' });
  } catch {
    return res.status(400).json({ message: 'Invalid student ID' });
  }
});

app.get('/api/rooms', async (_req, res) => {
  try {
    if (useMemoryStore) {
      return res.json(memoryRooms.map(roomPayload));
    }

    const rooms = await Room.find().sort({ roomNumber: 1 });
    const result = await Promise.all(
      rooms.map(async (room) => ({ ...room.toObject(), occupied: await Student.countDocuments({ roomNumber: room.roomNumber }) }))
    );
    return res.json(result);
  } catch {
    return res.status(500).json({ message: 'Could not load rooms' });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const roomNumber = String(req.body.roomNumber || '').trim();
    const capacity = Number(req.body.capacity);
    if (!roomNumber || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      return res.status(400).json({ message: 'Enter a room number and capacity from 1 to 20' });
    }

    if (useMemoryStore) {
      if (memoryRooms.some((room) => room.roomNumber.toLowerCase() === roomNumber.toLowerCase())) {
        return res.status(409).json({ message: 'Room already exists' });
      }

      const room = {
        _id: randomUUID(),
        roomNumber,
        capacity,
        createdAt: new Date(),
      };
      memoryRooms = [...memoryRooms, room];
      return res.status(201).json(room);
    }

    const createdRoom = await Room.create({ roomNumber, capacity });
    return res.status(201).json(createdRoom);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Room already exists' });
    }
    return res.status(500).json({ message: 'Could not add room' });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    if (useMemoryStore) {
      const room = memoryRooms.find((item) => item._id === req.params.id);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      if (memoryStudents.some((student) => student.roomNumber === room.roomNumber)) {
        return res.status(400).json({ message: 'Cannot delete an occupied room' });
      }
      memoryRooms = memoryRooms.filter((item) => item._id !== req.params.id);
      return res.json({ message: 'Room deleted' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (await Student.exists({ roomNumber: room.roomNumber })) {
      return res.status(400).json({ message: 'Cannot delete an occupied room' });
    }
    await room.deleteOne();
    return res.json({ message: 'Room deleted' });
  } catch {
    return res.status(400).json({ message: 'Invalid room ID' });
  }
});

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    useMemoryStore = true;
    console.log('No MONGODB_URI found. Starting in demo in-memory mode.');
    app.listen(port, '0.0.0.0', () => console.log(`API running on http://localhost:${port}`));
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    app.listen(port, '0.0.0.0', () => console.log(`API running on http://localhost:${port}`));
  } catch (error) {
    console.warn('MongoDB connection failed, falling back to demo in-memory mode:', error.message);
    useMemoryStore = true;
    app.listen(port, '0.0.0.0', () => console.log(`API running on http://localhost:${port}`));
  }
};

startServer();
