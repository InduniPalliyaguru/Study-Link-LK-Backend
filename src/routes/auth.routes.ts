import { Router } from "express"
import { register, login, me, refresh } from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../validators/auth.validator"

const router = Router()

router.post("/register", validate(registerSchema), register)
router.post("/login", validate(loginSchema), login)
router.post("/refresh", validate(refreshSchema), refresh)
router.get("/me", authenticate, me)

export default router
