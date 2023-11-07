//router.js
import express from "express";
import userRouter from "./user-management/user.router";
import productRouter from "./product-management/product.router";

const router = express.Router();

export default (): express.Router => {
  userRouter(router);
  productRouter(router);
  return router;
};
