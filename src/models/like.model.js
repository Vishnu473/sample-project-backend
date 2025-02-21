import mongoose, {Schema} from "mongoose";

export const LikeSchema = new Schema({

});

export const Like = mongoose.model("Like",LikeSchema);