const express = require("express");
const { register, login } = require("../controllers/authController"); // Correctly destructuring 'register' and 'login'

const router = express.Router();

router.post("/register", register); // Using the correct 'register' function
router.post("/login", login); // Using the correct 'login' function

module.exports = router;
