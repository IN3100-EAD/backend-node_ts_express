import express from "express";

import { protectedRoute } from "../user-management/auth.controller";
import { createCheckoutSession } from "./checkout.controller";

export default (router: express.Router) => {
  router.post("/checkout", protectedRoute, createCheckoutSession);
};
