import { Router } from "express"
import { register, login, me, refresh } from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../validators/auth.validator"
import { UserRole } from "../models/user.model"
import { sendSuccess } from "../utils/response"

const router = Router()

router.post("/register", validate(registerSchema), register)
router.post("/login", validate(loginSchema), login)
router.post("/refresh", validate(refreshSchema), refresh)
router.get("/me", authenticate, me)

// temporary route, only to test role-based access (we will remove it later)
router.get(
  "/admin-check",
  authenticate,
  requireRole(UserRole.ADMIN),
  (_req, res) => {
    sendSuccess(res, 200, "You are an admin")
  },
)

export default router
