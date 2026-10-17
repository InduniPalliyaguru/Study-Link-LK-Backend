import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError"
import multer from "multer"

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

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 5MB or smaller"
        : err.code === "LIMIT_UNEXPECTED_FILE" ||
            err.code === "LIMIT_FILE_COUNT"
          ? "You can upload at most 4 images (form field name: images)"
          : err.message

    res.status(400).json({ success: false, message })
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
