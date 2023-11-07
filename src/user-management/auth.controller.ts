//auth.controller.ts
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import UserModel, { UserAttr, UserDoc } from "./user.model";
import { catchAsync, AppError } from "../utils";
import { RequestWithUser } from "../types";

const createSendJWTToken = (
  user: UserDoc,
  statusCode: number,
  res: Response,
  next: NextFunction
) => {
  const JWT_SECRET: string | undefined =
    process.env.JWT_SECRET;
  const JWT_EXPIRES_IN: string | undefined =
    process.env.JWT_EXPIRES_IN;

  if (!JWT_EXPIRES_IN || !JWT_SECRET)
    return next(
      new AppError(
        "JWT_EXPIRES_IN or JWT_SECRET is not defined",
        500
      )
    );

  const jwtToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

  const JWT_EXPIRES_IN_MS =
    Number(JWT_EXPIRES_IN.slice(0, -1)) *
    24 *
    60 *
    60 *
    1000;

  const cookieOptions = {
    expires: new Date(Date.now() + JWT_EXPIRES_IN_MS),
    httpOnly: true,
    secure: process.env.NODE_ENV?.trim() === "production",
  };

  res.cookie("jwt", jwtToken, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token: jwtToken,
  });
};

// REGISTER USER : CUSTOMER
const register = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const {
      email,
      name,
      password,
      confirmPassword,
      phoneNumber,
      role,
    } = req.body;

    const newCustomer = await UserModel.create({
      email,
      name,
      password,
      confirmPassword,
      phoneNumber,
      role,
    });

    createSendJWTToken(newCustomer, 201, res, next);
  }
);

interface loginRequestBody {
  email: string;
  password: string;
}

// LOGIN USER
const login = catchAsync(
  async (
    req: Request<any, any, loginRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password)
      return next(
        new AppError(
          "Please provide email and password",
          400
        )
      );

    // 2) Check if user exists && password is correct
    const user = await UserModel.findOne({
      email,
    }).select("+password");

    if (
      !user ||
      !(await user.comparePasswords(
        password,
        user.password
      ))
    )
      return next(
        new AppError("Incorrect email or password", 401)
      );

    // 3) If everything ok, send token to client
    createSendJWTToken(user, 200, res, next);
  }
);

// PROTECTED ROUTES
const protectedRoute = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    let token: string | undefined;

    // 1) Getting token and check if it exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token)
      return next(
        new AppError(
          "You are not logged in! Please log in to get access",
          401
        )
      );

    // 2) Verification token
    const JWT_SECRET: string | undefined =
      process.env.JWT_SECRET;

    if (!JWT_SECRET)
      return next(
        new AppError("JWT_SECRET is not defined", 500)
      );

    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string")
      return next(new AppError("Invalid token", 401));

    // 3) Check if user still exists
    const currentUser = await UserModel.findById(
      decoded.id
    );

    if (!currentUser)
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );

    // 4) Grant access to protected route
    req.user = currentUser;
    next();
  }
);

type UserRole =
  | "customer"
  | "inventoryManager"
  | "deliveryPerson"
  | "superAdmin";

// RESTRICTED ROUTES
const restrictTo = (...roles: UserRole[]) => {
  return (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError(
          "You are not logged in! Please log in to get access",
          401
        )
      );

    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403
        )
      );

    next();
  };
};

// LOGOUT USER
const logout = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    res.clearCookie("jwt");

    res.status(200).json({
      status: "success",
    });
  }
);

// UPDATE USER PASSWORD
const updatePassword = catchAsync(
  async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user)
      return next(
        new AppError(
          "You are not logged in! Please log in to get access",
          401
        )
      );

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // 1) Get user from collection
    const user = await UserModel.findById(
      req.user.id
    ).select("+password");

    // 2) Check if POSTed current password is correct
    if (
      !user ||
      !(await user.comparePasswords(
        currentPassword,
        user.password
      ))
    )
      return next(
        new AppError("Your current password is wrong.", 401)
      );

    // 3) If so, update password
    user.password = newPassword;
    user.confirmPassword = confirmPassword;

    await user.save({
      validateBeforeSave: true,
    });

    // 4) Log user in, send JWT
    createSendJWTToken(user, 200, res, next);
  }
);

export {
  register,
  login,
  protectedRoute,
  restrictTo,
  logout,
  updatePassword,
};
