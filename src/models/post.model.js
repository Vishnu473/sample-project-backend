import mongoose, { Schema } from "mongoose";

const PostSchema = new Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title:{type:String, default:""},
    description: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    privacy: { type: String, enum: ["public", "private"], default: "public" },
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", PostSchema);
