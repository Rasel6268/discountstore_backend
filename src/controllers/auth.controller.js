const {
  RegisterService,
  LoginService,
  profileService,
  authMeService,
} = require("../services/auth.service");

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
const register = async (req, res) => {
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
/**
 * @route POST /api/auth/login
 * @desc Login user and set JWT cookie
 * @access Public
 */
const login = async (req, res) => {
  try {
    const result = await LoginService(req.body);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: true,        
      sameSite: "none",    
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: result.user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
/**
 * @route POST /api/auth/logout
 * @desc Logout user (clear cookie)
 * @access Private
 */
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user
 * @access Private
 */
const authMe = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const result = await authMeService(token);

    if (result.error) {
      return res.status(401).json(result);
    }

    return res.status(200).json({
      success: true,
      message: "Authenticated user",
      user: result.user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
const editProfile = async (req, res) => {
  try {
    const result = await profileService(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  authMe,
  editProfile,
};
