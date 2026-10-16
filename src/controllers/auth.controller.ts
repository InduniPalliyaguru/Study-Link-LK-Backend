import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import { User } from "../models/user.model"

export const register = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      district,
      phone,
      institution,
      educationLevel,
    } = req.body

    if (!name || !email || !password || !district) {
      res.status(400).json({
        success: false,
        message: "name, email, password and district are required",
      })
      return
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      })
      return
    }

    const existing = await User.findOne({ email })
    if (existing) {
      res
        .status(409)
        .json({ success: false, message: "Email is already registered" })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      district,
      phone,
      institution,
      educationLevel,
    })

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      res
        .status(409)
        .json({ success: false, message: "Email is already registered" })
      return
    }
    console.error(err)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}
