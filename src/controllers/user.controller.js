import { User } from "../models/user.model";
import { asyncHandler } from "../services/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

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

//handle confirmPassword, email at frontEnd
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  if (![username, password, email].some((val) => val.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.find({
    $or: [{username}, {email}],
  });

  if (!existedUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({ username, password, email });

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

const loginUser = asyncHandler(async (req, res) => {
    const {username,email,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Username or email is required")
    }

    const existedUser = User.find({
        $or: [{username}, {email}],
      });
    
      if (!existedUser) {
        throw new ApiError(400, "User does not exists");
      }

      const isPasswordValid = existedUser.isPasswordCorrect(password)

      if(!isPasswordValid){
        throw new ApiError("Invalid user credentials")
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

const logOutUser = asyncHandler(async(req,res) => {
    const user = await User.findById(req.user._id)

    if(!user){
        throw new ApiError("Something went wrong, retry logging out after sometime")
    }

    const options={
        secure:true,
        httpOnly:true
      }

      return res.status(200)
      .clearcookie("accessToken",options)
      .clearcookie("refreshToken",options)
      .json(
        new ApiResponse(200,{},"User loggedOut successfully")
      )
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const ispasswordValid = user.isPasswordCorrect(oldPassword);

    if(!ispasswordValid){
        throw ApiError(400,"oldPassword didnot match")
    }

    user.password = newPassword;
    user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

export {registerUser,loginUser,logOutUser,changeCurrentPassword}