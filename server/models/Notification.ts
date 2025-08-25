import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // Add index
  message: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'price_alert', 'top_up', 'system'
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true }, // Add index
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 