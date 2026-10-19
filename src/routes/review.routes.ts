import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"
import { createReviewSchema } from "../validators/review.validator"
import { create } from "../controllers/review.controller"

const router = Router()

router.post("/", authenticate, validate(createReviewSchema), create)

export default router
