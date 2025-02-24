import mongoose, { Schema } from "mongoose";

const PostSchema = new Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "",unique:true },
    description: { type: String, default: "",unique:true },
    mediaUrl: { type: String, default: "" },
    privacy: { type: String, enum: ["public", "private"], default: "public" },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

PostSchema.methods.trimTags = function(){
  if(this.tags && Array.isArray(this.tags)){
    this.tags = this.tags.map(tag => tag.trim()).filter(t => t !== "")
  }
}

export const Post = mongoose.model("Post", PostSchema);
