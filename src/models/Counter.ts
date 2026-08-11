import mongoose, { Schema, type Model } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  }
);

export type CounterDocument = ICounter;

const MongooseCounterModel =
  (mongoose.models.Counter as Model<CounterDocument> | undefined) ??
  mongoose.model<CounterDocument>("Counter", counterSchema, "counters");

export const Counter = MongooseCounterModel;