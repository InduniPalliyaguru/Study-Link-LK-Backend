import { Request, Response } from "express"
import { ApiError } from "../utils/ApiError"
import { registerUser, loginUser, getMe } from "../services/auth.service"
import { AuthRequest } from "../middleware/auth.middleware"

export const register = async (req: Request, res: Response) => {
  try {
    const data = await registerUser(req.body)

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ success: false, message: err.message })
      return
    }

    console.error(err)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const data = await loginUser(req.body)

    res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ success: false, message: err.message })
      return
    }

    console.error(err)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getMe(req.user!.id)

    res.status(200).json({
      success: true,
      message: "Profile fetched",
      data,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ success: false, message: err.message })
      return
    }

    console.error(err)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}
