const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const result = await pool.query(
        "SELECT id, name, email, status FROM users WHERE id = $1",
        [decoded.id]
      );
      const user = result.rows[0];

      if (!user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      if (user.status === "blocked" || user.status === "deleted") {
        return res
          .status(403)
          .json({
            message: "User account is blocked or deleted. Please log in again.",
          });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
