import mongoose from "mongoose";

interface DeliveryAttr {
  orderId: mongoose.Schema.Types.ObjectId;
  status: string;
  deliveryPersonId: mongoose.Schema.Types.ObjectId;
  failureReason?: string;
  statusUpdates: {
    status: string;
    timeStamp: Date;
  }[];
}

interface DeliveryDoc
  extends mongoose.Document,
    DeliveryAttr {}

const statusUpdateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "ready for pickup",
        "in transit",
        "delivered",
        "failed",
      ],
      required: [true, "Status is required"],
    },
    timeStamp: {
      type: Date,
      default: Date.now(),
    },
  },
  { _id: false }
);

const deliverySchema: mongoose.Schema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "ready for pickup",
        "in transit",
        "delivered",
        "failed",
      ],
      default: "ready for pickup",
    },
    failureReason: {
      type: String,
      default: null,
    },
    statusUpdates: [statusUpdateSchema],
  }
);

const DeliveryModel = mongoose.model<DeliveryDoc>(
  "Delivery",
  deliverySchema
);

export default DeliveryModel;
