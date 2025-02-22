import { User } from "../models/user.model.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async function(userId){
    try {
        const user = await User.findById(userId);
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        // await user.save({validateBeforeSave:false}); use if any field is changed
        await user.save();
    
        return {accessToken,refreshToken}
    } catch (error) {
        
    }
}

export const getAllUsers = asyncHandler(async(req,res) => {
  const users = await User.find();
  if(!users){
    res.status(404).json("no data")
  }
  res.status(200)
  .json({
    users
  })
})

//handle confirmPassword, email at frontEnd
export const registerUser = asyncHandler(async (req, res) => {
  const { username, password, email,profilePic,bio } = req.body;

  if ([username, password, email].some((val) => val.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{username}, {email}],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({ username, password, email,profilePic, bio });

  const registeredUser = await User.findById(user._id).select(
    "-password"
  );

  if (!registeredUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering....\nTry after some time."
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, registeredUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
    const {username,email,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Username or email is required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}],
      });
    
      if (!existedUser) {
        throw new ApiError(400, "User does not exists");
      }

      console.log(existedUser.username, existedUser.password)

      const isPasswordValid = await existedUser.isPasswordCorrect(password)
      console.log(password,isPasswordValid);
      if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
      }

      const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(existedUser._id);

      const loggedInUser = await User.findById(existedUser._id).select("-password")
      
      const options={
        secure:true,
        httpOnly:true
      }

      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
        new ApiResponse(200,loggedInUser,"User loggedin successfully")
      )
});

export const logOutUser = asyncHandler(async(req,res) => {
    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError("Something went wrong, retry logging out after sometime")
    }

    const options={
        secure:true,
        httpOnly:true
      }

      return res.status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(
        new ApiResponse(200,{},"User loggedOut successfully")
      )
})

export const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const ispasswordValid = await user.isPasswordCorrect(oldPassword);

    if(!ispasswordValid){
        throw ApiError(400,"oldPassword didnot match")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})
