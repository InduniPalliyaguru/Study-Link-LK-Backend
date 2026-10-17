import multer from "multer"
import { ApiError } from "../utils/ApiError"

const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new ApiError(400, "Only JPG, PNG or WEBP images are allowed"))
      return
    }
    cb(null, true)
  },
})
