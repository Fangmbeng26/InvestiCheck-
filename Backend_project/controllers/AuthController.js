import User from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, country } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      country
    });
    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json({ message: "User created successfully", user:safeUser });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error",  });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter the required fields"
      });
    }

    const user = await User.findOne({ email }).select("+password");

    const invalidCredentials = () =>
      res.status(401).json({message: "Invalide email or password"});

    if (!user) {
      return invalidCredentials();
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return invalidCredentials();
    }

    const token = jwt.sign(
      { id: user._id,
        role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h"
    });
    

    return res.status(200).json({
      message: "User logged in successfully",
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error", });
  }
};