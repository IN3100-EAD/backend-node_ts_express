//product.controller.ts
import { NextFunction, Response } from "express";

import ProductModel from "./product.model";
import { AppError, catchAsync } from "../utils";
import { RequestWithUser } from "../types";
import CategoryModel from "./category.model";
import { stripeHandler } from "../index";

interface createProductItemRequestBody {
  category: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  mainImage: string;
  additionalImages?: string[];
  isListed?: boolean;
  discount?: number;
}

const createProductItem = catchAsync(
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
      category,
      name,
      description,
      price,
      quantity,
      mainImage,
      additionalImages,
      isListed,
      discount,
    } = req.body as createProductItemRequestBody;

    const formattedCategory = category.toLowerCase().trim();

    const categoryDoc = await CategoryModel.findOne({
      name: formattedCategory,
    });

    if (!categoryDoc)
      return next(
        new AppError(
          "Category not found,Please Check again or Create new category first",
          404
        )
      );

    const productDoc = await ProductModel.create({
      name,
      description,
      price,
      quantity,
      mainImage,
      additionalImages,
      isListed,
      discount,
      category: categoryDoc._id,
      listedBy: req.user._id,
    });

    await stripeHandler.createProduct(
      productDoc._id,
      productDoc.name,
      productDoc.description,
      productDoc.price,
      productDoc.mainImage
    );

    res.status(201).json({
      status: "success",
      data: productDoc,
    });
  }
);

const getAllProducts = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const products = await ProductModel.find().populate({
      path: "category",
      select: "name",
    });

    res.status(200).json({
      status: "success",
      data: products,
    });
  }
);

const updateProduct = catchAsync(
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
      name,
      description,
      mainImage,
      additionalImages,
    } = req.body;

    const productDoc = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        mainImage,
        additionalImages,
      },
      { new: true }
    );

    if (!productDoc)
      return next(new AppError("Product not found", 404));

    res.status(200).json({
      status: "success",
      data: productDoc,
    });
  }
);

const deleteProduct = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError("You are not logged in", 401)
      );

    const productDoc = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        isListed: false,
      }
    );

    if (!productDoc)
      return next(new AppError("Product not found", 404));

    res.status(200).json({
      status: "success",
    });
  }
);

const getProduct = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const productDoc = await ProductModel.findById(
      req.params.id
    ).populate({
      path: "category",
      select: "name",
    });

    if (!productDoc)
      return next(new AppError("Product not found", 404));

    res.status(200).json({
      status: "success",
      data: productDoc,
    });
  }
);

const updatePrice = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { price } = req.body;

    const productDoc = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        price,
      },
      { new: true }
    );

    if (!productDoc)
      return next(new AppError("Product not found", 404));

    await stripeHandler.updateProductPrice(
      productDoc._id,
      productDoc.price
    );

    res.status(200).json({
      status: "success",
      data: productDoc,
    });
  }
);

const discountProduct = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { discount } = req.body;

    const productDoc = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        discount,
      },
      { new: true }
    );

    if (!productDoc)
      return next(new AppError("Product not found", 404));

    res.status(200).json({
      status: "success",
      data: productDoc,
    });
  }
);

type InventoryUpdate = {
  id: string;
  quantity: number;
};

const updateInventory = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const inventoryUpdates: InventoryUpdate[] = req.body;

    // Iterate over the array and update each product
    for (const update of inventoryUpdates) {
      await ProductModel.findByIdAndUpdate(
        update.id,
        { quantity: update.quantity },
        { new: true, runValidators: false }
      );
    }

    res.status(200).json({
      status: "success",
    });
  }
);

export {
  createProductItem,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getProduct,
  updatePrice,
  discountProduct,
  updateInventory,
};
