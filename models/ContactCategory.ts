import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const contactCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

contactCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export type ContactCategoryDocument = Omit<
  InferSchemaType<typeof contactCategorySchema>,
  "userId"
> & {
  _id: string;
  userId: Types.ObjectId;
};

export const ContactCategoryModel =
  models.ContactCategory || model("ContactCategory", contactCategorySchema);
