//user.model.ts
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

interface Address {
  [x: string]: any;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface UserAttr {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phoneNumber: string;
  role:
    | "customer"
    | "inventoryManager"
    | "deliveryPerson"
    | "superAdmin";
  address: Address[];
  stripeCustomerId: string;
}

interface UserDoc extends mongoose.Document, UserAttr {
  comparePasswords: (
    candidatePassword: string,
    userPassword: string
  ) => Promise<boolean>;
}

const AddressSchema: mongoose.Schema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postal_code: { type: String, required: true },
  country: { type: String, default: "LK" },
});

const UserSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Please provide a email"],
      unique: true,
      validator: [
        validator.isEmail,
        "Please provide a valid email",
      ],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [
        6,
        "Password must be at least 6 characters long",
      ],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, "Please provide a password"],
      validate: {
        validator: function (this: UserDoc, el: string) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    address: [{ type: AddressSchema }],
    phoneNumber: {
      type: String,
      validator: [
        validator.isMobilePhone,
        "Please provide a valid phone number",
      ],
      required: [true, "Please provide a phone number"],
    },
    role: {
      type: String,
      enum: [
        "customer",
        "inventoryManager",
        "deliveryPerson",
        "superAdmin",
      ],
      default: "customer",
    },
    stripeCustomerId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// PRE-SAVE MIDDLEWARE
UserSchema.pre<UserDoc>("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.confirmPassword = undefined;
  next();
});

// INSTANCE METHODS

// COMPARE PASSWORDS
UserSchema.methods.comparePasswords = async function (
  candidatePassword: string,
  userPassword: string
) {
  return await bcrypt.compare(
    candidatePassword,
    userPassword
  );
};

const UserModel = mongoose.model<UserDoc>(
  "User",
  UserSchema
);

export default UserModel;

export { UserDoc, UserAttr, AddressSchema, Address };
