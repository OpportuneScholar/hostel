import mongoose from 'mongoose';
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  capacity: { type: Number, required: true, min: 1, default: 2 }
}, { timestamps: true });
export default mongoose.model('Room', roomSchema);
