import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const electricityReadingSchema = new Schema(
  {
    meterId: {
      type: Schema.Types.ObjectId,
      ref: "ElectricityMeter",
      required: true,
      index: true,
    },
    readingMonth: {
      type: String,
      required: true,
    },
    reading: {
      type: Number,
      required: true,
      min: 0,
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

electricityReadingSchema.index({ meterId: 1, readingMonth: 1 }, { unique: true });

electricityReadingSchema.index({ userId: 1, readingMonth: -1 });

export type ElectricityReadingDocument = Omit<
  InferSchemaType<typeof electricityReadingSchema>,
  "userId"
> & {
  _id: string;
  userId: Types.ObjectId;
};

export const ElectricityReadingModel =
  models.ElectricityReading || model("ElectricityReading", electricityReadingSchema);
