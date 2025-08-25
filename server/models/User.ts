import mongoose, { Schema, Document } from 'mongoose';
import { type User as UserType } from "@shared/schema";

export interface IUserDocument extends Omit<UserType, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, required: false },
  linkedWalletBalanceBtc: { type: String, required: true, default: "0.00" }, // New BTC balance field
  linkedWalletBalanceUsdt: { type: String, required: true, default: "0.00" }, // New USDT balance field
  smsNumber: { type: String, required: false },
  autoTopUpEnabled: { type: Boolean, default: true },
  smsAlertsEnabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = (ret._id as mongoose.Types.ObjectId).toString();
    delete ret._id;
  }
});

const User = mongoose.model<IUserDocument>('User', UserSchema);

export default User; 