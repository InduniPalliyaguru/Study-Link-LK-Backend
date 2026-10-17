import { Router } from "express"
import { login, register, me, refresh } from "../controllers/auth.controller"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"
import { UserRole } from "../models/user.model"

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.post("/refresh", refresh)

router.get("/me", authenticate, me)

// for testing
router.get(
  "/admin-check",
  authenticate,
  requireRole(UserRole.ADMIN),
  (req, res) => {
    res.status(200).json({ success: true, message: "You are an admin" })
  },
)

export default router
