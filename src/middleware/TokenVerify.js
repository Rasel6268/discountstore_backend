const jwt = require('jsonwebtoken')
const TokenVerify = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    
    next();
};