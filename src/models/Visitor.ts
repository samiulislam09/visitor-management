import mongoose, { Schema, type Model, type Document, type Types } from "mongoose";
import { VISITOR_STATUSES, VISIT_PURPOSES } from "@/lib/constants";

export type VisitorStatusValue = (typeof VISITOR_STATUSES)[number];

export interface IVisitor extends Document {
  visitorId: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  photoUrl?: string;
  idType?: string;
  idNumber?: string;
  purpose: string;
  customPurpose?: string;
  hostId: Types.ObjectId;
  department?: string;
  expectedDate?: Date;
  expectedTime?: string;
  expectedDuration?: number;
  numberOfVisitors?: number;
  vehicleNumber?: string;
  notes?: string;
  status: VisitorStatusValue;
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const visitorSchema = new Schema<IVisitor>(
  {
    visitorId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: undefined },
    address: { type: String, trim: true, default: undefined },
    company: { type: String, trim: true, default: undefined },
    photoUrl: { type: String, trim: true, default: undefined },
    idType: { type: String, trim: true, default: undefined },
    idNumber: { type: String, trim: true, default: undefined },
    purpose: { type: String, required: true, enum: VISIT_PURPOSES },
    customPurpose: { type: String, trim: true, default: undefined },
    hostId: { type: Schema.Types.ObjectId, ref: "Host", required: true },
    department: { type: String, trim: true, default: undefined },
    expectedDate: { type: Date, default: undefined },
    expectedTime: { type: String, trim: true, default: undefined },
    expectedDuration: { type: Number, default: undefined },
    numberOfVisitors: { type: Number, default: undefined },
    vehicleNumber: { type: String, trim: true, default: undefined },
    notes: { type: String, trim: true, default: undefined },
    status: { type: String, enum: VISITOR_STATUSES, required: true },
    checkInTime: { type: Date, default: undefined },
    checkOutTime: { type: Date, default: undefined },
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

export type VisitorDocument = IVisitor;

const MongooseVisitorModel =
  (mongoose.models.Visitor as Model<VisitorDocument> | undefined) ??
  mongoose.model<VisitorDocument>("Visitor", visitorSchema);

export const Visitor = MongooseVisitorModel;
export { visitorSchema };

visitorSchema.index({ visitorId: 1 }, { unique: true });
visitorSchema.index({ phone: 1 });
visitorSchema.index({ fullName: 1, createdAt: -1 });
visitorSchema.index({ hostId: 1, createdAt: -1 });
visitorSchema.index({ status: 1, createdAt: -1 });
visitorSchema.index({ checkInTime: 1 });
visitorSchema.index({ purpose: 1, createdAt: -1 });
visitorSchema.index({ department: 1, createdAt: -1 });
visitorSchema.index({ createdAt: -1 });