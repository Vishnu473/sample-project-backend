import mongoose, {Schema} from "mongoose";

export const ConnectionSchema = new Schema({

});

export const Connection = mongoose.model("Connection",ConnectionSchema);