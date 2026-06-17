const User = require("../models/User");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const cookies = require("cookie-parser");

const RegisterService = async (registerData) => {
  const { name, email, password } = registerData;

  try {
    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "Email already exists" };
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    
    

    return {
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    };
  } catch (error) {
    return { error: "Registration failed", details: error.message };
  }
};
const LoginService = async (body) => {
  const { email, password } = body;

  //finds user by email
  const findUser = await User.findOne({ email });
  if (!findUser) {
    return { error: "Invalid email or password" };
  }
  
  const isMatchPass = await bcrypt.compare(
    password.trim(),
    findUser.password.trim()
  );


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
const makeAdminService = async (userId, adminStatus) => {
  const user = await User.findById(userId);
  try {
    const user = await User.findByIdAndUpdate(
      { _id: userId },
      { role: adminStatus.role },
      { returnDocument:"after" },
    );
    return {
      success: true,
      message: "Admin status updated successfully",
      user,
    };
  } catch (error) {
    return { success: false, message: "Error updating admin status", error };
  }
};
const LogoutService = (body) => {};
module.exports = {
  RegisterService,
  LoginService,
  LogoutService,
  profileService,
  authMeService,
  makeAdminService,
};
