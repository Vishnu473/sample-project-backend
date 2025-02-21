import mongoose, {Schema} from "mongoose";

export const CommentSchema = new Schema({

});

export const Comment = mongoose.model("Comment",CommentSchema);