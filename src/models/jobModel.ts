// jobModel.ts
import mongoose, { Schema, Document, Model } from 'mongoose';



export interface JobDocument extends Document {
  OTP: number;
  expired: Date;
  createdAt: Date; 
  [key: string]: any;
}

const JobSchema = new Schema<JobDocument>(
  {
    OTP: { type: Number, required: true },
    expired: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { strict: false }
);

export const JobModel: Model<JobDocument> = mongoose.model('authflux', JobSchema);
