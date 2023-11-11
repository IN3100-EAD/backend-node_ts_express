import mongoose from "mongoose";

interface OrderAttr {
  customer: mongoose.Schema.Types.ObjectId;
  products: {
    product: mongoose.Schema.Types.ObjectId;
    quantity: number;
  }[];
  stripeCheckoutSessionId: string;
  subtotal: number | null;
  totalAmount: number | null;
  shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

interface OrderDoc extends mongoose.Document, OrderAttr {}

const OrderSchema: mongoose.Schema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer is required"],
    },
    products: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
        },
      },
    ],
    stripeCheckoutSessionId: {
      type: String,
      required: [
        true,
        "Stripe Checkout Session Id is required",
      ],
      unique: [
        true,
        "Stripe Checkout Session Id must be unique",
      ],
    },
    subtotal: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    shippingAddress: {
      line1: {
        type: String,
      },
      line2: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      postal_code: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    isFullFilled: {
      type: Boolean,
      default: false,
    },
    fullFilledAt: {
      type: Date,
    },
    fullFilledBy: {
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

// PRE-MIDDLEWARE

// MIDDLEWARE ONLY WORK ON NEWLY CREATED DOC, REMOVING ADDITIONAL 00 FROM TOTALAMOUNT AND SUBTOTAL. 00 IS ADDED BY STRIPE
OrderSchema.pre<OrderDoc>("save", function (next) {
  if (!this.isNew) return next();

  if (this.totalAmount) {
    this.totalAmount = this.totalAmount / 100;
  }

  if (this.subtotal) {
    this.subtotal = this.subtotal / 100;
  }

  next();
});

const OrderModel = mongoose.model<OrderDoc>(
  "Order",
  OrderSchema
);

export default OrderModel;
