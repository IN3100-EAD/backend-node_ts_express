import express from "express";

import userRouter from "./user-management/user.router";
import productRouter from "./product-management/product.router";
import cartRouter from "./cart-management/cart.router";
import checkoutRouter from "./checkout-management/checkout.router";
import orderRouter from "./order-management/order.router";

const router = express.Router();

export default (): express.Router => {
  userRouter(router);
  productRouter(router);
  cartRouter(router);
  checkoutRouter(router);
  orderRouter(router);
  return router;
};
