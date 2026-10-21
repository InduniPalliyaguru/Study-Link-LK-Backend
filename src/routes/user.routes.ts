import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/user.validator"
import {
  publicProfile,
  updateMe,
  changeMyPassword,
} from "../controllers/user.controller"
import { getForUser } from "../controllers/review.controller"

const router = Router()

router.put("/me", authenticate, validate(updateProfileSchema), updateMe)
router.put(
  "/me/password",
  authenticate,
  validate(changePasswordSchema),
  changeMyPassword,
)

router.get("/:id/public", publicProfile)
router.get("/:id/reviews", getForUser)

export default router
