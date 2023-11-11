import express from "express";
import {
  protectedRoute,
  restrictTo,
} from "../user-management/auth.controller";
import {
  fulfillOrder,
  getAllOrdersForCustomer,
  getAllUnfulfilledOrders,
} from "./order.controller";

export default (router: express.Router) => {
  router.get(
    "/orders",
    protectedRoute,
    getAllOrdersForCustomer
  );
  router.get(
    "/orders/unfilled",
    protectedRoute,
    restrictTo("superAdmin", "inventoryManager"),
    getAllUnfulfilledOrders
  );
  router.patch(
    "/orders/:id/fulfill",
    protectedRoute,
    restrictTo("superAdmin", "inventoryManager"),
    fulfillOrder
  );
};
