const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
});

const register = async (req, res) => {
  console.log("Registering user with data:", req.body);
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email, and password are required." });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email or username." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password_hash,
      role: role === "admin" ? "admin" : "user",
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user: safeUser(user),
      token: generateToken(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return res.status(400).json({ message: "email or username and password are required." });
    }

    const user = await User.findOne(
      email ? { email: email.toLowerCase() } : { username }
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      user: safeUser(user),
      token: generateToken(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

const me = async (req, res) => {
  return res.status(200).json({ user: safeUser(req.user) });
};

module.exports = {
  register,
  login,
  me,
};
