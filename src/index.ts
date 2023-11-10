import express, {
  NextFunction,
  Request,
  Response,
} from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";
import path from "path";
import morgan from "morgan";

import router from "./router";
import { AppError, ErrorHandler } from "./utils";
import StripeHandler from "./checkout-management/stripe.handler";

// CONFIG ENV VARIABLES
dotenv.config({
  path: path.join(__dirname, "../.env.local"),
});

// CONFIG EXPRESS
const app = express();

// CONFIG CORS
app.use(cors());

// CONFIG MORGAN: DEV LOGGING
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CONFIG BODY PARSER
app.use(bodyParser.json());

// CONFIG COOKIE PARSER
app.use(cookieParser());

// CONFIG COMPRESSION
app.use(compression());

// CONFIG SERVER
const server = http.createServer(app);

const SERVER_PORT = process.env.SERVER_PORT || 8080;

server.listen(SERVER_PORT, () => {
  console.log(
    `Server running on http://localhost:${SERVER_PORT}`
  );
});

// CONFIG MONGODB
const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  console.error(
    "MONGODB_URL is not defined in your environment variables."
  );
  process.exit(1); // Exit the application on error
}

mongoose.Promise = global.Promise; // Use global Promise

const mongooseOptions: ConnectOptions = {};

mongoose
  .connect(MONGODB_URL, mongooseOptions)
  .then(() => {
    console.log("Mongoose connected to MongoDB.");
  })
  .catch((err) => {
    console.error(
      "Mongoose connection error: " + err.message
    );
    process.exit(1); // Exit the application on error
  });

// CONFIG STRIPE
export const stripeHandler = new StripeHandler();

// ROUTE HANDLING
app.use("/api/v1", router());

// HANDLE UNHANDLED ROUTES
app.all(
  "*",
  (req: Request, res: Response, next: NextFunction) => {
    next(
      new AppError(
        `Can't find ${req.originalUrl} on this server!`,
        404
      )
    );
  }
);

// GLOBAL ERROR HANDLING
app.use(ErrorHandler.globalErrorController);
