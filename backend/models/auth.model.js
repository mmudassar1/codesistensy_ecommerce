import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          min: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);



// pre save hook to hash password
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    // Check if the password is already hashed
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (Password) {
  try {
    return await bcrypt.compare(Password, this.password);
  } catch (error) {
    throw new Error("Error comparing password");
  }
};

const User = mongoose.model("User", userSchema);

export default User;