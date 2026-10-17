import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError"

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message })
    return
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    })
    return
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    })
    return
  }

  if (err instanceof mongoose.Error.CastError) {
    res
      .status(400)
      .json({ success: false, message: `Invalid value for ${err.path}` })
    return
  }

  const e = err as {
    code?: number
    keyPattern?: Record<string, unknown>
    type?: string
  }

  if (e.code === 11000) {
    const field = Object.keys(e.keyPattern ?? {})[0] ?? "value"
    res.status(409).json({ success: false, message: `${field} already exists` })
    return
  }

  if (e.type === "entity.parse.failed") {
    res.status(400).json({ success: false, message: "Invalid JSON body" })
    return
  }

  console.error(err)
  res.status(500).json({ success: false, message: "Internal server error" })
}
