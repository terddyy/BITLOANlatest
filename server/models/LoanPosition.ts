import mongoose, { Schema, Document } from 'mongoose';
import { type LoanPosition as LoanPositionType } from "@shared/schema";

// Omit 'id' from LoanPositionType to avoid conflict with Mongoose's virtual 'id' getter
// and explicitly define _id as it comes from MongoDB
export interface ILoanPositionDocument extends Omit<LoanPositionType, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const LoanPositionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  positionName: { type: String, required: true },
  collateralBtc: { type: String, required: true },
  collateralUsdt: { type: String, required: true, default: "0.00" }, // Re-added USDT collateral
  borrowedAmount: { type: String, required: true },
  apr: { type: String, required: true },
  healthFactor: { type: String, required: true },
  isProtected: { type: Boolean, default: true },
  liquidationPrice: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

LoanPositionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    // Ensure 'id' is always a string and maps from MongoDB's _id
    ret.id = (ret._id as mongoose.Types.ObjectId).toString();
    delete ret._id; // Remove _id from the transformed object
  }
});

const LoanPosition = mongoose.model<ILoanPositionDocument>('LoanPosition', LoanPositionSchema);

export default LoanPosition; 