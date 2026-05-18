const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookies = require("cookie-parser");

const RegisterService = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const result = await RegisterService(req.body);

    if (result.error) {
      if (result.type === "DUPLICATE_ERROR") {
        return res.status(409).json(result);
      }
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
const LoginService = async (body) => {
  const { email, password } = body;

  //finds user by email
  const findUser = await User.findOne({ email });
  if (!findUser) {
    return { error: "Invalid email or password" };
  }
  //compares the password with the hashed password in the database
  const isMatchPass = await bcrypt.compare(password, findUser.password);
  if (!isMatchPass) {
    return { error: "Invalid email or password" };
  }

  //generates a JWT token for the authenticated user
  const token = jwt.sign(
    {
      id: findUser._id,
      email: findUser.email,
      role: findUser.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  return {
    user: {
      id: findUser._id,
      name: findUser.name,
      email: findUser.email,
      role: findUser.role,
    },
    token,
  };
};
const authMeService = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return { error: "User not found" };
    }

    return {
      user,
    };
  } catch (error) {
    return { error: "Invalid or expired token" };
  }
};
const profileService = async (updateData) => {
  const { email } = updateData;
  try {
    const user = await User.updateOne({ email }, { $set: updateData });
    return { success: true, message: "Profile updated successfully", user };
  } catch (error) {
    return { success: false, message: "Error updating profile", error };
  }
};

const LogoutService = (body) => {};
module.exports = {
  RegisterService,
  LoginService,
  LogoutService,
  profileService,
  authMeService
};
