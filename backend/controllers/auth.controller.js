import User from "../models/auth.model.js";
import redis from "../lib/redis.js";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refreshToken:${userId}`,
    refreshToken,
    "EX",
    60 * 60 * 24 * 7
  ); // Store for 7 days
};

const setCookie = (res, accessToken, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
    maXage: 24 * 60 * 60 * 7, // 7 days
  });
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: "Strict", // Prevent CSRF attacks
    maXage: 15 * 60 * 1000, // 15 minutes
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "user already exists with this email",
      });
    }
    // Validate input
    // Check if all fields are filled
    if (!name || !email || !password) {
      return res.status(400).send("Please fill all fields");
    }
    if (password.length < 6) {
      return res
        .status(400)
        .send("password must be at least 6 characters long");
    }

    const newUser = await User.create({
      name,
      email,
      password,
    });

    // authenticate the user
    const { accessToken, refreshToken } = generateToken(newUser._id);

    // store the refresh token in cookie
    await storeRefreshToken(newUser._id, refreshToken);

    // set cookies for access and refresh tokens
    setCookie(res, accessToken, refreshToken);

    await newUser.save();
    res.status(201).json({
      message: "user created successfully",
      newUser: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json(error.message, "Error in signup");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // If user not found or password is invalid, return 404
      return res.status(404).json({ message: "user not found" });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // If password is invalid, return 401
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (user && (await user.comparePassword(password))) {
      // authenticate the user
      const { accessToken, refreshToken } = generateToken(user._id);

      // store the refresh token in Redis
      await storeRefreshToken(user._id, refreshToken);

      // set cookies for access and refresh tokens
      setCookie(res, accessToken, refreshToken);

      res.status(200).json({
        message: "login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await redis.del(`refreshToken:${decoded.userId}`); // Remove the refresh token from Redis
    }
    // Clear cookies
    res.clearCookie("accessToken"); // Clear the access token cookie
    res.clearCookie("refreshToken"); // Clear the cookie
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = decoded.userId;

    // Check if the refresh token exists in Redis
    const storedRefreshToken = await redis.get(`refreshToken:${userId}`);
    if (storedRefreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens
    const { accessToken, newRefreshToken } = generateToken(userId);

    // Store the new refresh token in Redis
    await storeRefreshToken(userId, newRefreshToken);

    // Set cookies for the new access and refresh tokens
    setCookie(res, accessToken, newRefreshToken);

    res.status(200).json({ message: "Tokens refreshed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error refreshing token", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is set in req.user by middleware
    const user = await User.findById(userId).select("-password -__v"); // Exclude password and version field
    if (!req.user) {
      return res.status(404).json({ message: "Not authenticated" });
       
    }
    res.status(200).json({
      message: "Profile fetched successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
};
 