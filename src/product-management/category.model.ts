import mongoose from "mongoose";

interface CategoryAttr {
  name: string;
  description: string;
}

interface CategoryDoc
  extends mongoose.Document,
    CategoryAttr {}

const CategorySchema: mongoose.Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const CategoryModel = mongoose.model<CategoryDoc>(
  "Category",
  CategorySchema
);

export default CategoryModel;
export { CategoryDoc };
