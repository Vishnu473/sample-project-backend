import mongoose, {Schema} from "mongoose";

export const FollowSchema = new Schema({

});

export const Follow = mongoose.model("Follow",FollowSchema);