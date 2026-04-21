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
    paymentMode: {
      type: String,
      enum: ["cash", "online"],
      required: true,
      default: "cash",
    },
    splitPayment: {
      cashAmount: {
        type: Number,
        min: 0,
      },
      onlineAmount: {
        type: Number,
        min: 0,
      },
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

const existingTransactionModel = models.Transaction;
if (
  existingTransactionModel &&
  (!("paymentMode" in existingTransactionModel.schema.paths) ||
    !("splitPayment" in existingTransactionModel.schema.paths))
) {
  delete models.Transaction;
}

export const TransactionModel =
  models.Transaction || model("Transaction", transactionSchema);
