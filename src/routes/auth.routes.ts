import { Router } from "express"
import {
  register,
  login,
  me,
  refresh,
  forgot,
  reset,
} from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth.middleware"
import { limitByEmail } from "../middleware/rateLimit.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotSchema,
  resetSchema,
} from "../validators/auth.validator"

const router = Router()

router.post("/register", validate(registerSchema), register)
router.post("/login", validate(loginSchema), login)
router.post("/refresh", validate(refreshSchema), refresh)
router.get("/me", authenticate, me)

router.post(
  "/forgot-password",
  validate(forgotSchema),
  limitByEmail(
    3,
    60 * 60 * 1000,
    "Too many reset requests for this email. Please try again later",
  ),
  forgot,
)
router.post("/reset-password", validate(resetSchema), reset)

export default router
