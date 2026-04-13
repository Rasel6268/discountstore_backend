const { RegisterService, LoginService } = require("../services/auth.service");

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
const register = async (req, res) => {
  
  try {
    const result = await RegisterService(req.body);

    if (result.error) {
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
    
     res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    return res.status(200).json({
      message: 'Login successful',
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
const logout = async (req, res) => {};

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user
 * @access Private
 */
const authMe = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Authenticated user",
      user: req.user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


module.exports = {
  register,
  login,
  logout,
  authMe
};
