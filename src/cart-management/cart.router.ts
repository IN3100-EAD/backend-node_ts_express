import express from "express";
import { protectedRoute } from "../user-management/auth.controller";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./cart.controller";

export default (router: express.Router) => {
  router.get("/cart", protectedRoute, getCart);
  router.post("/cart", protectedRoute, addCartItem);
  router.patch("/cart", protectedRoute, updateCartItem);
  router.delete("/cart", protectedRoute, removeCartItem);
};
