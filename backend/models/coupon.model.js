import mongoose from "mongoose";
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
    discount: {
        type: Number,
        required: true,
        min: 0,
        max: 100, // Assuming discount is a percentage
    },
    expirationDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model 
        ref: "User", // Assuming you have a User model
        required: true, // Optional if the coupon can be used by any user
        unique: true
    }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
});

 const Coupon = mongoose.model("Coupon", couponSchema)

export default Coupon;
