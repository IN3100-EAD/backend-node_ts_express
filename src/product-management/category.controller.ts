//category.controller.ts
import mongoose from "mongoose";
import { NextFunction, Response } from "express";

import { catchAsync } from "../utils";
import { RequestWithUser } from "../types";
import CategoryModel from "./category.model";

const createCategory = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    const { name, description } = req.body;

    const categoryDoc = await CategoryModel.create({
      name,
      description,
    });

    res.status(201).json({
      status: "success",
      data: categoryDoc,
    });
  }
);

const getAllCategories = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    const categories = await CategoryModel.find().select(
      "name description id"
    );

    res.status(200).json({
      status: "success",
      length: categories?.length,
      data: categories,
    });
  }
);

const updateCategory = catchAsync(
  async (req: RequestWithUser, res: Response) => {
    const { name, description } = req.body;

    const categoryDoc =
      await CategoryModel.findByIdAndUpdate(
        req.params.id,
        {
          name,
          description,
        },
        { new: true }
      );

    res.status(200).json({
      status: "success",
      data: categoryDoc,
    });
  }
);

export { createCategory, getAllCategories, updateCategory };
