import mongoose, { Schema, type Model, type Document } from "mongoose";
import { HOST_STATUSES } from "@/lib/constants";

export interface IHost extends Document {
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  status: (typeof HOST_STATUSES)[number];
  createdAt: Date;
  updatedAt: Date;
}

const hostSchema = new Schema<IHost>(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: undefined },
    phone: { type: String, trim: true, default: undefined },
    department: { type: String, trim: true, default: undefined },
    designation: { type: String, trim: true, default: undefined },
    status: { type: String, enum: HOST_STATUSES, required: true, default: "ACTIVE" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export type HostDocument = IHost;

const MongooseHostModel =
  (mongoose.models.Host as Model<HostDocument> | undefined) ??
  mongoose.model<HostDocument>("Host", hostSchema);

export const Host = MongooseHostModel;
export { hostSchema };

hostSchema.index({ name: 1 });
hostSchema.index({ department: 1, status: 1 });
hostSchema.index({ status: 1 });