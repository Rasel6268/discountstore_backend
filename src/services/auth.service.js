const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookies = require("cookie-parser");

const RegisterService = async (body) => {
  
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
     return { success: false, message: "Email already registered", type: "DUPLICATE_ERROR", status: 409 };
  }
 

  const userData = new User({ name, email, password });
   

  const savedUser = await userData.save();
  const userObj = savedUser.toObject();
  delete userObj.password;

  return { message: "User registered successfully", user: userObj ,success: true,status: 201};
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

const LogoutService = (body) => {};
module.exports = {
  RegisterService,
  LoginService,
  LogoutService,
};
