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
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import morgan from "morgan";

import router from "./router";

// CONFIG ENV VARIABLES
dotenv.config({
  path: path.join(__dirname, "../.env.local"),
});

// CONFIG EXPRESS
const app = express();

// CONFIG CORS
app.use(cors());

// CONFIG MORGAN : DEV LOGGING
if (process.env.NODE_ENV?.trim() === "development") {
  app.use(morgan("dev"));
}

// CONFIG BODY PARSER
app.use(bodyParser.json());

// CONFIG COOKIE PARSER
app.use(cookieParser());

// CONFIG COMPRESSION
app.use(compression());

// CONIFG SERVER
const server = http.createServer(app);

const SERVER_PORT = process.env.SERVER_PORT || 8080;

server.listen(SERVER_PORT, () => {
  console.log(
    `Server running on http://localhost:${SERVER_PORT}`
  );
});

// CONFIG MONGODB
const MONGODB_URL = process.env.MONGODB_URL;

mongoose.Promise = Promise;
if (MONGODB_URL) {
  mongoose.connect(MONGODB_URL);
} else {
  console.error("MONGODB_URL is undefined");
}

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MONGODB_URL");
});

mongoose.connection.on("error", (err: mongoose.Error) => {
  console.error(
    "Mongoose connection error: " + err.message
  );
});

// ROUTE HANDLING
app.use("/", router());

// ? - HANDLE UNHANDLED ROUTES
app.all(
  "*",
  (req: Request, res: Response, next: NextFunction) => {
    next(
      new Error(
        `Can't find ${req.originalUrl} on this server!`
      )
    );
  }
);
