import mongoose from "mongoose";
import AppError from "./appError";
import { Request, Response, NextFunction } from "express";

class ErrorHandler {
  static sendErrorDev(err: AppError, res: Response) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  }

  static sendErrorProd(err: AppError, res: Response) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    console.error("ERROR 💥", err);
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  static globalErrorController(
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV?.trim() === "development") {
      ErrorHandler.sendErrorDev(err, res);
    } else if (
      process.env.NODE_ENV?.trim() === "production"
    ) {
      ErrorHandler.sendErrorProd(err, res);
    }
    next();
  }
}

export default ErrorHandler;
