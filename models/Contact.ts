import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "ContactCategory",
      required: true,
      index: true,
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

contactSchema.index({ userId: 1, name: 1, mobile: 1 });

export type ContactDocument = Omit<InferSchemaType<typeof contactSchema>, "userId" | "categoryId"> & {
  _id: string;
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
};

export const ContactModel = models.Contact || model("Contact", contactSchema);
