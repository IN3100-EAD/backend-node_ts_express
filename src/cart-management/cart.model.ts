import mongoose from "mongoose";

interface CartAttrs {
  userId: string;
  items: Array<{
    productId: mongoose.Schema.Types.ObjectId;
    quantity: number;
  }>;
}

interface CartDoc extends mongoose.Document, CartAttrs {}

const cartSchema: mongoose.Schema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const CartModel = mongoose.model<CartDoc>(
  "Cart",
  cartSchema
);

export default CartModel;

export { CartDoc };
