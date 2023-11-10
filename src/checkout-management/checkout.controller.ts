import { NextFunction, Response } from "express";
import { RequestWithUser } from "../types";
import { catchAsync, AppError } from "../utils";
import UserModel from "../user-management/user.model";
import { stripeHandler } from "../index";

const createCheckoutSession = catchAsync(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user)
      return next(new AppError("You need to login to checkout", 401));

    const { cart } = req.body;

    const lineItems = await Promise.all(
      cart.map((item) => {
        return stripeHandler.createLineItem(item.id, item.quantity);
      })
    );

    let customer = await UserModel.findById(req.user._id);

    if (!customer)
      return next(new AppError("No Customer Found with that id", 401));

    const session = await stripeHandler.createCheckoutSession(
      customer.stripeCustomerId,
      lineItems
    );

    res.send({
      status: "success",
      url: session.url,
    });
  }
);

export { createCheckoutSession };
