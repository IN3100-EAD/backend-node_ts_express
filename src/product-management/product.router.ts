//product.router.ts
import express from "express";

import {
  createCategory,
  getAllCategories,
  updateCategory,
} from "./category.controller";

import {
  protectedRoute,
  restrictTo,
} from "../user-management/auth.controller";

import {
  createProductItem,
  deleteProduct,
  discountProduct,
  getAllProducts,
  updateInventory,
  updatePrice,
  updateProduct,
} from "./product.controller";

export default (router: express.Router) => {
  router.get("/products/category", getAllCategories);
  router.post(
    "/products/category",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    createCategory
  );
  router.patch(
    "/products/category/:id",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    updateCategory
  );

  router.get("/products", getAllProducts);
  router.post(
    "/products/create",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    createProductItem
  );
  router.patch(
    "/products/update/:id",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    updateProduct
  );
  router.patch(
    "/products/delete/:id",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    deleteProduct
  );
  router.patch(
    "/products/update-inventory",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    updateInventory
  );
  router.patch(
    "/products/update-price/:id",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    updatePrice
  );
  router.patch(
    "/products/discount/:id",
    protectedRoute,
    restrictTo("inventoryManager", "superAdmin"),
    discountProduct
  );
};
