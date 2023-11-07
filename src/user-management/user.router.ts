import express from "express";

import {
  login,
  register,
  protectedRoute,
  restrictTo,
  updatePassword,
  logout,
} from "./auth.controller";
import {
  addAddress,
  deleteAddress,
  getAllUsers,
} from "./user.controller";

export default (router: express.Router) => {
  router.post("/auth/login", login);
  router.post("/auth/register", register);
  router.post(
    "/auth/update-password",
    protectedRoute,
    updatePassword
  );
  router.post("/auth/logout", protectedRoute, logout);

  router.get(
    "/users",
    protectedRoute,
    restrictTo("superAdmin"),
    getAllUsers
  );
  router.post(
    "/users/add-address",
    protectedRoute,
    addAddress
  );
  router.delete(
    "/users/address/:id",
    protectedRoute,
    deleteAddress
  );
};
