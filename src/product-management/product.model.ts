import mongoose from "mongoose";

interface ProductAttr {
  name: string;
  description: string;
  price: number;
  quantity: number;
  mainImage: string;
  additionalImages: string[];
  isListed: boolean;
  category: mongoose.Schema.Types.ObjectId;
  discount: number;
  listedBy: mongoose.Schema.Types.ObjectId;
}

interface ProductDoc
  extends mongoose.Document,
    ProductAttr {}

const ProductSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
    mainImage: {
      type: String,
      required: [true, "Main image is required"],
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    listedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// PRE MIDDLEWARE

const ProductModel = mongoose.model<ProductDoc>(
  "Product",
  ProductSchema
);

export default ProductModel;

export { ProductDoc };
