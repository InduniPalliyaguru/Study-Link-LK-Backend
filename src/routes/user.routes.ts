import { Router } from "express"
import { publicProfile } from "../controllers/user.controller"
import { getForUser } from "../controllers/review.controller"

const router = Router()

// public - anyone can see a seller's profile and reviews
router.get("/:id/public", publicProfile)
router.get("/:id/reviews", getForUser)

export default router
