const { RegisterService, LoginService } = require("../services/auth.service");

const Register = async (req, res) => {
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
const Login = async (req, res) => {
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

const Logout = async (req, res) => {};

module.exports = {
  Register,
  Login,
  Logout,
};
