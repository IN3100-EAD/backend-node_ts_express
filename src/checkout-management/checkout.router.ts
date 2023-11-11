import express from "express";

import { protectedRoute } from "../user-management/auth.controller";
import {
  createCheckoutSession,
  stripeWebhook,
} from "./checkout.controller";

export default (router: express.Router) => {
  router.post(
    "/stripe/checkout",
    protectedRoute,
    createCheckoutSession
  );
};
