import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const customerQuerySchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    queryText: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
      required: true,
    },
    followUpNote: {
      type: String,
      default: "",
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
    lastFollowedUpAt: {
      type: Date,
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

customerQuerySchema.index({ userId: 1, createdAt: -1 });

export type CustomerQueryDocument = Omit<
  InferSchemaType<typeof customerQuerySchema>,
  "userId"
> & {
  _id: string;
  userId: Types.ObjectId;
};

export const CustomerQueryModel =
  models.CustomerQuery || model("CustomerQuery", customerQuerySchema);
