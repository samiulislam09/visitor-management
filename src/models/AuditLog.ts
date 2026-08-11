import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: undefined },
    userId: { type: String, default: undefined },
    userName: { type: String, default: undefined },
    metadata: { type: Schema.Types.Mixed, default: undefined },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = IAuditLog;

const MongooseAuditLogModel =
  (mongoose.models.AuditLog as Model<AuditLogDocument> | undefined) ??
  mongoose.model<AuditLogDocument>("AuditLog", auditLogSchema);

export const AuditLog = MongooseAuditLogModel;
export { auditLogSchema };