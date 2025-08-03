const pool = require("../config/db");
const bcrypt = require("bcryptjs"); // Make sure bcryptjs is imported
const jwt = require("jsonwebtoken");

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash, created_at, status)
   VALUES ($1, $2, $3, NOW(), 'active') RETURNING id, name, email`,
      [name, email, hashedPassword]
    );
    // Generate JWT token
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is blocked or deleted
    if (user.status === "blocked" || user.status === "deleted") {
      return res.status(403).json({
        message: "Account is inactive or blocked. Please contact support.",
      });
    }

    // Compare passwords
    // Use user.password_hash as stored in the database
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last_login_time
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status, // Include status in response
      },
    });
  } catch (error) {
    console.error("Login error:", error.message); // This will log the bcrypt error
    res.status(500).json({ message: "Server error during login" });
  }
};

module.exports = {
  register,
  login,
};
