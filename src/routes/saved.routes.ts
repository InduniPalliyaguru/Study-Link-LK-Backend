import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { save, unsave, list, ids } from "../controllers/saved.controller"

const router = Router()

router.use(authenticate)

router.get("/", list)
router.get("/ids", ids)
router.put("/:listingId", save)
router.delete("/:listingId", unsave)

export default router
