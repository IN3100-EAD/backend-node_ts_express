//user.controller.ts
import { Request, Response, NextFunction } from "express";

import UserModel, {
  UserDoc,
} from "../user-management/user.model";
import {
  catchAsync,
  AppError,
  apiFeatures,
} from "../utils";
import { RequestWithUser } from "../types";
import { stripeHandler } from "../index";

const getAllUsers = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const features = new apiFeatures(
      UserModel.find(),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const users = await features.query;

    res.status(200).json({
      status: "success",
      data: users,
    });
  }
);

interface AddressRequestBody {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  province: string;
  postal_code: string;
  country: string;
}

const addAddress = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError("You are not logged in", 401)
      );

    const {
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
    } = req.body as AddressRequestBody;

    const address = {
      line1,
      line2,
      city,
      state,
      postal_code,
      country,
    };

    const user = await UserModel.findById(req.user._id);

    if (!user)
      return next(new AppError("User not found", 404));

    user.address.push(address);

    await user.save({
      validateBeforeSave: false,
    });

    await stripeHandler.addAdressToCustomer(
      user.stripeCustomerId,
      user.name,
      user.phoneNumber,
      address
    );

    res.status(200).json({
      status: "success",
    });
  }
);

const deleteAddress = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError("You are not logged in", 401)
      );

    const { id } = req.params;

    const user = await UserModel.findById(req.user._id);

    if (!user)
      return next(new AppError("User not found", 404));

    if (user.address.length === 0)
      return next(
        new AppError("No address found to delete", 404)
      );

    const filteredAddresses = user.address.filter(
      (item) => item._id.toString() !== id
    );

    user.address = filteredAddresses;
    await user.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      status: "success",
      data: user,
    });
  }
);

export { getAllUsers, addAddress, deleteAddress };
