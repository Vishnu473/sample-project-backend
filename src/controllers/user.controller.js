import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../services/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async function (userId) {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //use if any field is changed

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

//For Testing purpose only
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  if (!users) {
    res.status(404).json("no data");
  }
  res.status(200).json({
    users,
  });
});

//handle confirmPassword, email at frontEnd
export const registerUser = asyncHandler(async (req, res) => {
  const { username, password, email, profilePic, bio } = req.body;

  if ([username, password, email].some((val) => val.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    username,
    password,
    email,
    profilePic,
    bio,
  });

  const registeredUser = await User.findById(user._id).select(
    "-password -refreshToken"
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
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const existedUser = await User.findOne({
    email,
  });

  if (!existedUser) {
    throw new ApiError(400, "User does not exists");
  }

  console.log(existedUser.username, existedUser.password);

  const isPasswordValid = await existedUser.isPasswordCorrect(password);
  console.log(password, isPasswordValid);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    existedUser._id
  );

  const loggedInUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, {secure:true, httpOnly: true, maxAge: 7*24*60*60*1000})
    .cookie("refreshToken", refreshToken, {secure:true, httpOnly: true, maxAge: 21*24*60*60*1000})
    .json(new ApiResponse(200, loggedInUser, "User loggedin successfully"));
});

export const logOutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(
      500,
      "Something went wrong, retry logging out after sometime"
    );
  }

  const options = {
    secure: true,
    httpOnly: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggedOut successfully"));
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const ispasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!ispasswordValid) {
    throw new ApiError(400, "oldPassword didnot match");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, profilePic, bio } = req.body;

  if ([username, email].some((val) => val === "")) {
    throw new ApiError("400", "Name and Email fields are mandatory");
  }

  // Check if username or email that user is changing to already available mail or username
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
    _id: { $ne: req.user?._id }, // Exclude current user from check
  });

  if (existingUser) {
    throw new ApiError(400, "Username or Email is already taken. Try other");
  }

  const UserToBeUpdated = await User.findByIdAndUpdate(
    req.user?._id,
    {
      username,
      email,
      profilePic,
      bio,
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, UserToBeUpdated, "User updated successfully"));
});

export const getUserProfile = asyncHandler(async (req, res) => {
  //If req.params.userId ==> Get the a's profile that b clicked
  //If no req.params.userId ==> Then user clicked on his profile.
  const userId = req.params?.id || req.user?._id;

  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user profile fetched successfully"));
});

export const searchUsers = asyncHandler(async (req, res) => {
  const searchQuery = req.query.query;

  if (!searchQuery) {
    throw new ApiError(400, "Search query is required");
  }
  console.log(searchQuery);

  const users = await User.find({
    $or: [
      { fullName: { $regex: `^${searchQuery}`, $options: "i" } }, // Match from start of name and case-insensitive
      { email: { $regex: `^${searchQuery}`, $options: "i" } }, // Match from start of email and case-insensitive
    ],
  }).select("-password -refreshToken");

  if (!users || users.length < 1) {
    throw new ApiError(404, "No matching users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldRefreshToken =
    req.cookies.refreshToken || req.headers.authorization?.refreshToken;

  if (!oldRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = await jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_SECRET_TOKEN
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refreshToken");
    }

    if (oldRefreshToken !== user?.refreshToken) {
      throw new ApiError(403, "Reuse token detected, Login Again");
    }

    const accessOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 7*24*60*60*1000
    };

    const refreshOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 21*24*60*60*1000
    };

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens();

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessOptions)
      .cookie("refreshToken", refreshToken, refreshOptions)
      .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh Token");
  }
});
