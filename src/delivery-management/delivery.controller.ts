import { NextFunction, Response } from "express";
import { RequestWithUser } from "../types";
import {
  catchAsync,
  AppError,
  apiFeatures,
} from "../utils";

import DeliveryModel from "./delivery.model";
import UserModel from "../user-management/user.model";
import OrderModel from "../order-management/order.model";

const createNewDelivery = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { orderId } = req.params;

    const { deliveryPersonId } = req.body;

    const deliveryPerson = await UserModel.findById(
      deliveryPersonId
    );

    if (deliveryPerson?.role !== "deliveryPerson") {
      return next(
        new AppError(
          "Can not be assigned, role: deliveryPerson is required",
          500
        )
      );
    }

    const delivery = await DeliveryModel.create({
      orderId,
      deliveryPersonId,
      ["statusUpdates.0"]: {
        status: "ready for pickup",
      },
    });

    res.status(201).json({
      status: "success",
      delivery,
    });
  }
);

const getAllDeliveries = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const features = new apiFeatures(
      DeliveryModel.find(),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const deliveries = await features.query;

    res.status(200).json({
      status: "success",
      deliveries,
    });
  }
);

const pickUpDelivery = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { deliveryId } = req.params;

    const delivery = await DeliveryModel.findById(
      deliveryId
    );

    if (!delivery) {
      return next(new AppError("Delivery not found", 404));
    }

    if (
      req.user?._id.toString() !==
      delivery.deliveryPersonId.toString()
    ) {
      return next(
        new AppError(
          "You are not authorized to update this delivery",
          401
        )
      );
    }

    switch (delivery.status) {
      case "ready for pickup":
        break;
      case "in transit":
        return next(
          new AppError(
            "Delivery is already in transit",
            401
          )
        );
      case "delivered":
        return next(
          new AppError("Delivery is already delivered", 401)
        );
      case "failed":
        return next(
          new AppError("Delivery has already failed", 401)
        );
    }

    delivery.status = "in transit";
    delivery.statusUpdates.push({
      status: "in transit",
      timeStamp: new Date(Date.now()),
    });

    await delivery.save();

    res.status(200).json({
      status: "success",
      delivery,
    });
  }
);

const deliverDelivery = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { deliveryId } = req.params;

    const delivery = await DeliveryModel.findById(
      deliveryId
    );

    if (!delivery) {
      return next(new AppError("Delivery not found", 404));
    }

    if (
      req.user?._id.toString() !==
      delivery.deliveryPersonId.toString()
    ) {
      return next(
        new AppError(
          "You are not authorized to update this delivery",
          401
        )
      );
    }

    switch (delivery.status) {
      case "ready for pickup":
        return next(
          new AppError("Delivery is not in transit", 401)
        );
      case "in transit":
        break;
      case "delivered":
        return next(
          new AppError("Delivery is already delivered", 401)
        );
      case "failed":
        return next(
          new AppError("Delivery has already failed", 401)
        );
    }

    delivery.status = "delivered";
    delivery.statusUpdates.push({
      status: "delivered",
      timeStamp: new Date(Date.now()),
    });

    await delivery.save();

    res.status(200).json({
      status: "success",
      delivery,
    });
  }
);

const failDelivery = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { deliveryId } = req.params;

    const { failureReason } = req.body;

    if (!failureReason) {
      return next(
        new AppError("Failure reason is required", 400)
      );
    }

    const delivery = await DeliveryModel.findById(
      deliveryId
    );

    if (!delivery) {
      return next(new AppError("Delivery not found", 404));
    }

    if (
      req.user?._id.toString() !==
      delivery.deliveryPersonId.toString()
    ) {
      return next(
        new AppError(
          "You are not authorized to update this delivery",
          401
        )
      );
    }

    switch (delivery.status) {
      case "ready for pickup":
        return next(
          new AppError("Delivery is not in transit", 401)
        );
      case "in transit":
        break;
      case "delivered":
        return next(
          new AppError("Delivery is already delivered", 401)
        );
      case "failed":
        return next(
          new AppError("Delivery has already failed", 401)
        );
    }

    delivery.status = "failed";
    delivery.failureReason = failureReason;

    delivery.statusUpdates.push({
      status: "failed",
      timeStamp: new Date(Date.now()),
    });

    await delivery.save();

    res.status(200).json({
      status: "success",
      delivery,
    });
  }
);

const getAssignedDeliveries = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const features = new apiFeatures(
      DeliveryModel.find({
        deliveryPersonId: req.user?._id,
      }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const deliveries = await features.query;

    res.status(200).json({
      status: "success",
      deliveries,
    });
  }
);

const getDeliveryStatus = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { deliveryId } = req.params;

    const delivery = await DeliveryModel.findById(
      deliveryId
    );

    if (!delivery) {
      return next(new AppError("Delivery not found", 404));
    }

    console.log(delivery);

    const order = await OrderModel.findById(
      delivery.orderId.toString()
    );

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (
      req.user?.role === "customer" &&
      req.user?._id.toString() !== order.customer.toString()
    ) {
      return next(
        new AppError(
          "You are not authorized to view this delivery",
          401
        )
      );
    }

    if (
      req.user?.role === "deliveryPerson" &&
      req.user?._id.toString() !==
        delivery.deliveryPersonId.toString()
    ) {
      return next(
        new AppError(
          "You are not authorized to view this delivery",
          401
        )
      );
    }

    res.status(200).json({
      status: "success",
      delivery,
    });
  }
);

export {
  createNewDelivery,
  getAllDeliveries,
  pickUpDelivery,
  deliverDelivery,
  failDelivery,
  getAssignedDeliveries,
  getDeliveryStatus,
};
