import mongoose, { Schema } from "mongoose";

const FollowSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "blocked"], default: "accepted" }, // For private accounts
  blocked: { type: Boolean, default: false } // To mark if the user is blocked
}, { timestamps: true });

export const Follow = mongoose.model("Follow", FollowSchema);