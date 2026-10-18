import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  createRequestSchema,
  respondSchema,
  shipSchema,
  confirmSchema,
} from "../validators/request.validator"
import {
  create,
  sent,
  received,
  respond,
  cancel,
  ship,
  confirm,
  regenerate,
  completeManual,
} from "../controllers/request.controller"

const router = Router()

// every request route needs a logged-in user
router.use(authenticate)

router.post("/", validate(createRequestSchema), create)
router.get("/sent", sent)
router.get("/received", received)

// seller actions
router.patch("/:id/respond", validate(respondSchema), respond)
router.patch("/:id/ship", validate(shipSchema), ship)
router.post("/:id/regenerate-code", regenerate)
router.patch("/:id/complete", completeManual)

// buyer actions
router.patch("/:id/cancel", cancel)
router.patch("/:id/confirm", validate(confirmSchema), confirm)

export default router
