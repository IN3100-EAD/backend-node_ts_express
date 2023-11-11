import { NextFunction, Response } from "express";
import Stripe from "stripe";

import { AppError, catchAsync } from "../utils";
import OrderModel from "./order.model";
import { RequestWithUser } from "../types";

const createNewOrder = async (
  next: NextFunction,
  customer: string,
  products: string,
  stripeCheckoutSessionId: string,
  subtotal: number | null,
  totalAmount: number | null,
  shippingAddress: Stripe.Checkout.Session.ShippingDetails | null
) => {
  try {
    // string products convert to object {product: string, quantity: number}
    const parsedProducts = JSON.parse(products);

    let shippingAddressObject: {
      line1: string | null;
      line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
      country: string | null;
    };

    if (shippingAddress && shippingAddress.address) {
      shippingAddressObject = {
        line1: shippingAddress.address.line1,
        line2: shippingAddress.address.line2,
        city: shippingAddress.address.city,
        state: shippingAddress.address.state,
        postal_code: shippingAddress.address.postal_code,
        country: shippingAddress.address.country,
      };
    }

    await OrderModel.create({
      customer,
      products: parsedProducts,
      stripeCheckoutSessionId,
      subtotal,
      totalAmount,
      shippingAddress,
    });
  } catch (error) {
    next(new AppError("Error Creating Order", 500));
    console.log(error);
  }
};

const getAllOrdersForCustomer = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(
        new AppError("User is not logged in", 404)
      );
    }

    const orders = await OrderModel.find({
      customer: req.user._id,
    }).populate("products.id", "name price mainImage");

    res.status(200).json({
      status: "success",
      orders,
    });
  }
);

const getAllUnfulfilledOrders = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    const orders = await OrderModel.find({
      isFullFilled: false,
    }).populate("products.id", "name price mainImage");

    res.status(200).json({
      status: "success",
      orders,
    });
  }
);

const fulfillOrder = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError("User is not logged in", 404)
      );

    const order = await OrderModel.findByIdAndUpdate(
      req.params.id,
      {
        isFullFilled: true,
        fullFilledAt: Date.now(),
        fullFilledBy: req.user._id,
      },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      order,
    });
  }
);

export {
  createNewOrder,
  getAllOrdersForCustomer,
  getAllUnfulfilledOrders,
  fulfillOrder,
};
