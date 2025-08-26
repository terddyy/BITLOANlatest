import mongoose, { Schema, Document } from 'mongoose';
import { TopUpTransactionType } from "@shared/schema";

interface ITopUpTransactionDocument extends TopUpTransactionType, Document {
  _id: mongoose.Types.ObjectId;
  id: string;
}

const TopUpTransactionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  loanPositionId: { type: String, required: true },
  amount: { type: String, required: true },
  currency: { type: String, required: true },
  isAutomatic: { type: Boolean, required: true },
  txHash: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TopUpTransactionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = (ret._id as mongoose.Types.ObjectId).toString();
    delete ret._id;
  }
});

const TopUpTransaction = mongoose.model<ITopUpTransactionDocument>('TopUpTransaction', TopUpTransactionSchema);

export default TopUpTransaction; 