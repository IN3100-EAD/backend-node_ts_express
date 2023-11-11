import { NextFunction, Request, Response } from "express";
import { RequestWithUser } from "../types";
import { catchAsync, AppError } from "../utils";
import UserModel from "../user-management/user.model";
import { stripeHandler } from "../index";
import Stripe from "stripe";
import { createNewOrder } from "../order-management/order.controller";

const createCheckoutSession = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError("You need to login to checkout", 401)
      );

    const { cart } = req.body;

    const lineItems = await Promise.all(
      cart.map((item) => {
        return stripeHandler.createLineItem(
          item.id,
          item.quantity
        );
      })
    );

    let customer = await UserModel.findById(req.user._id);

    if (!customer)
      return next(
        new AppError("No Customer Found with that id", 401)
      );

    const session =
      await stripeHandler.createCheckoutSession(
        customer.stripeCustomerId,
        lineItems,
        JSON.stringify(cart),
        customer._id.toString()
      );

    res.send({
      status: "success",
      url: session.url,
    });
  }
);

const stripeWebhook = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const sig = req.headers["stripe-signature"];

    // This is your Stripe CLI webhook secret for testing your endpoint locally.
    const endpointSecret =
      "whsec_eda8c82f74377a5eb3ee913decdf8e8a91ef3598b63bd516cdc390c2b6bdc0c7";

    let event: Stripe.Event;

    try {
      event = await stripeHandler.validateWebhook(
        endpointSecret,
        sig as string,
        req
      );
    } catch (error) {
      console.log(error);
      return next(new AppError("Webhook Error", 400));
    }

    if (event.type === "checkout.session.completed") {
      console.log("Payment was successful.");

      const {
        id,
        amount_subtotal,
        amount_total,
        shipping_details,
        metadata,
      } = event.data.object;

      const {
        cart,
        userId,
      }: {
        cart: string;
        userId: string;
      } = metadata as any;

      console.log(metadata);

      try {
        await createNewOrder(
          next,
          userId,
          cart,
          id,
          amount_subtotal,
          amount_total,
          shipping_details
        );
      } catch (error) {
        console.log(error);
        return next(new AppError("Webhook Error", 400));
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

export { createCheckoutSession, stripeWebhook };
