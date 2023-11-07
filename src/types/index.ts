import { Request } from "express";
import { UserDoc } from "../user-management/user.model";

interface RequestWithUser extends Request {
  user?: UserDoc;
}

export { RequestWithUser };
