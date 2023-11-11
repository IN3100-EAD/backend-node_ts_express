import express from "express";

import {
  protectedRoute,
  restrictTo,
} from "../user-management/auth.controller";

import {
  createNewDelivery,
  getAllDeliveries,
  pickUpDelivery,
  deliverDelivery,
  failDelivery,
  getAssignedDeliveries,
  getDeliveryStatus,
} from "./delivery.controller";

export default (router: express.Router) => {
  router.post(
    "/delivery/:orderId/create",
    protectedRoute,
    restrictTo("superAdmin", "inventoryManager"),
    createNewDelivery
  );
  router.patch(
    "/delivery/:deliveryId/pickup",
    protectedRoute,
    restrictTo("deliveryPerson"),
    pickUpDelivery
  );
  router.patch(
    "/delivery/:deliveryId/deliver",
    protectedRoute,
    restrictTo("deliveryPerson"),
    deliverDelivery
  );

  router.patch(
    "/delivery/:deliveryId/fail",
    protectedRoute,
    restrictTo("deliveryPerson"),
    failDelivery
  );

  router.get(
    "/delivery",
    protectedRoute,
    restrictTo("superAdmin", "inventoryManager"),
    getAllDeliveries
  );
  router.get(
    "/delivery/assigned",
    protectedRoute,
    restrictTo("deliveryPerson"),
    getAssignedDeliveries
  );
  router.get(
    "/delivery/:deliveryId",
    protectedRoute,
    getDeliveryStatus
  );
};
