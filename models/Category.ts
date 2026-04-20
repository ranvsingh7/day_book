import { model, models, Schema, type InferSchemaType, Types } from "mongoose";

const categorySchema = new Schema(
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

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export type CategoryDocument = Omit<InferSchemaType<typeof categorySchema>, "userId"> & {
  _id: string;
  userId: Types.ObjectId;
};

export const CategoryModel = models.Category || model("Category", categorySchema);
