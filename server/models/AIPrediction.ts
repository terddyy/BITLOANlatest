import mongoose, { Schema, Document } from 'mongoose';
import { AiPrediction } from "@shared/schema";

interface IAIPredictionDocument extends AiPrediction, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
}

const AIPredictionSchema: Schema = new Schema({
  timestamp: { type: Date, required: true, default: Date.now },
  predictedPrice: { type: String, required: true },
  confidence: { type: String, required: true },
  riskLevel: { type: String, required: true },
  timeHorizon: { type: Number, required: true },
  modelAccuracy: { type: String, required: true },
  priceData: { type: Schema.Types.Mixed, required: true },
  trend: { type: String, required: true },
  volatility: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AIPredictionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = (ret._id as mongoose.Types.ObjectId).toString();
    delete ret._id;
  }
});

const AIPrediction = mongoose.model<IAIPredictionDocument>('AIPrediction', AIPredictionSchema);

export default AIPrediction; 