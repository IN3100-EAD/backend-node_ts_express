//router.js
import express from "express";
import userRouter from "./user-management/user.router";
import productRouter from "./product-management/product.router";
import cartRouter from "./cart-management/cart.router";


const router = express.Router();

export default (): express.Router => {
  userRouter(router);
  productRouter(router);
  cartRouter(router);
  return router;
};
