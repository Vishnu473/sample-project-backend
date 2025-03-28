import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true},
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    refreshToken:{type:String},
    privacy:{type:String, enum:["public","followers", "private"], default:"public"}
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10)
  next()
})

UserSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_SECRET_TOKEN,
    {
      expiresIn: "24hr",
    }
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this.id,
      email: this.email,
      username: this.username,
    },
    process.env.REFRESH_SECRET_TOKEN,
    {
      expiresIn: "15d",
    }
  );
};

export const User = mongoose.model("User", UserSchema);
