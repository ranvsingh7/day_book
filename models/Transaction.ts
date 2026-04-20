import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const transactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
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

transactionSchema.index({ userId: 1, date: -1 });

export type TransactionDocument = Omit<
  InferSchemaType<typeof transactionSchema>,
  "userId"
> & {
  _id: string;
  userId: Types.ObjectId;
};

export const TransactionModel =
  models.Transaction || model("Transaction", transactionSchema);
