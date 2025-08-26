import mongoose, { Schema, Document } from 'mongoose';
import { PriceHistoryType } from "@shared/schema";

interface IPriceHistoryDocument extends PriceHistoryType, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
}

const PriceHistorySchema: Schema = new Schema({
  symbol: { type: String, required: true },
  price: { type: String, required: true },
  source: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PriceHistorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = (ret._id as mongoose.Types.ObjectId).toString();
    delete ret._id;
  }
});

const PriceHistory = mongoose.model<IPriceHistoryDocument>('PriceHistory', PriceHistorySchema);

export default PriceHistory; 