import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const electricityMeterSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    meterNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    startReading: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

electricityMeterSchema.index({ userId: 1, meterNumber: 1 }, { unique: true });

electricityMeterSchema.index({ userId: 1, createdAt: -1 });

export type ElectricityMeterDocument = Omit<
  InferSchemaType<typeof electricityMeterSchema>,
  "userId"
> & {
  _id: string;
  userId: Types.ObjectId;
};

export const ElectricityMeterModel =
  models.ElectricityMeter || model("ElectricityMeter", electricityMeterSchema);
