import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  createRequestSchema,
  respondSchema,
} from "../validators/request.validator"
import {
  create,
  sent,
  received,
  respond,
  cancel,
} from "../controllers/request.controller"

const router = Router()

router.use(authenticate)

router.post("/", validate(createRequestSchema), create)
router.get("/sent", sent)
router.get("/received", received)
router.patch("/:id/respond", validate(respondSchema), respond)
router.patch("/:id/cancel", cancel)

export default router
