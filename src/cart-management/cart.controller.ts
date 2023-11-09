import { Response, NextFunction } from "express";

import CartModel, { CartDoc } from "./cart.model";
import { catchAsync, AppError } from "../utils";
import { RequestWithUser } from "../types";
import ProductModel from "../product-management/product.model";

const createCart = (customerId: string) => {
  return CartModel.create({
    userId: customerId,
    items: [],
  });
};

const addCartItem = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError(
          "User is not logged in. Please log in to continue",
          401
        )
      );

    const { productId, quantity } = req.body;

    if (!productId || !quantity)
      return next(
        new AppError(
          "Please provide product id and quantity",
          400
        )
      );

    const userId = req.user._id;

    const product = await ProductModel.findById(productId);

    if (!product)
      return next(
        new AppError(
          "No Products is found with particular Id",
          404
        )
      );

    if (product.quantity < quantity)
      return next(
        new AppError(
          "Not enough quantity available. Please wait for the product to be restocked",
          400
        )
      );

    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      cart = await createCart(userId);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    console.log(itemIndex);

    if (itemIndex > -1) {
      // Item exists, update quantity
      return next(
        new AppError(
          "Item already exists. Please use updateCartItem route",
          400
        )
      );
    }

    // Item doesn't exist, add to cart
    cart.items.push({ productId, quantity });

    const updatedCart = await cart.save();

    // Populate product details
    const populatedCart = await CartModel.findById(
      updatedCart._id
    );

    res.status(200).json({
      status: "success",
      data: {
        cart: populatedCart,
      },
    });
  }
);

const updateCartItem = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError(
          "User is not logged in. Please log in to continue",
          401
        )
      );

    const { productId, change } = req.body;

    if (!productId || !change)
      return next(
        new AppError(
          "Please provide product id and change",
          400
        )
      );

    const userId = req.user._id;

    const product = await ProductModel.findById(productId);

    if (!product)
      return next(
        new AppError(
          "No Products is found with particular Id",
          404
        )
      );

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      return next(
        new AppError("No cart found for this user", 404)
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return next(
        new AppError(
          "No item with this productId found in the cart. Please Add the item to the cart instead.",
          404
        )
      );
    }

    cart.items[itemIndex].quantity += change;

    if (cart.items[itemIndex].quantity > product.quantity) {
      return next(
        new AppError(
          "Not enough quantity available. Please wait for the product to be restocked",
          400
        )
      );
    }

    if (cart.items[itemIndex].quantity < 1) {
      return next(
        new AppError(
          "Quantity of an item cannot be less than 1. Please remove the item from the cart instead.",
          400
        )
      );
    }

    await cart.save();

    res.status(200).json({
      status: "success",
    });
  }
);

const removeCartItem = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError(
          "User is not logged in. Please log in to continue",
          401
        )
      );

    const { productId } = req.body;
    const userId = req.user._id;

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      return next(
        new AppError("No cart found for this user", 404)
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return next(
        new AppError(
          "No item with this productId found in the cart",
          404
        )
      );
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    res.status(200).json({
      status: "success",
    });
  }
);

const getCart = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError(
          "User is not logged in. Please log in to continue",
          401
        )
      );

    const userId = req.user._id;

    let cart = await CartModel.findOne({ userId }).populate(
      "items.productId",
      "name price mainImage"
    );

    if (!cart) {
      cart = await createCart(userId);
    }

    res.status(200).json({
      status: "success",
      length: cart.items.length,
      cart: cart,
    });
  }
);

export {
  addCartItem,
  updateCartItem,
  removeCartItem,
  getCart,
};
