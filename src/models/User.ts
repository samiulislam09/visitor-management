import mongoose, { Schema, type Model, type Document } from "mongoose";
import { USER_ROLES } from "@/lib/constants";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: (typeof USER_ROLES)[number];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true, default: "RECEPTIONIST" },
    isActive: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  }
);

export type UserDocument = IUser;

const MongooseUserModel =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);

export const User = MongooseUserModel;
export { userSchema };

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });