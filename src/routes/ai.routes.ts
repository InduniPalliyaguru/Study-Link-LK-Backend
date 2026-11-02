import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { limitPerUser } from "../middleware/rateLimit.middleware"
import { validate } from "../middleware/validate.middleware"
import { assistSchema } from "../validators/ai.validator"
import { listingAssist } from "../controllers/ai.controller"

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

export default router
