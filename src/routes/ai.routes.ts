import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { limitPerUser } from "../middleware/rateLimit.middleware"
import { upload } from "../middleware/upload.middleware"
import { validate } from "../middleware/validate.middleware"
import { assistSchema } from "../validators/ai.validator"
import { listingAssist, coverScan } from "../controllers/ai.controller"

const router = Router()

router.post(
  "/listing-assist",
  authenticate,
  limitPerUser(
    15,
    60 * 60 * 1000,
    "You have used the AI assistant a lot. Please try again later",
  ),
  validate(assistSchema),
  listingAssist,
)

router.post(
  "/scan-cover",
  authenticate,
  limitPerUser(
    10,
    60 * 60 * 1000,
    "You have scanned a lot of covers. Please try again later",
  ),
  upload.single("image"),
  coverScan,
)

export default router
