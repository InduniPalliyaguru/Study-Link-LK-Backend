import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  createListingSchema,
  updateListingSchema,
} from "../validators/listing.validator"
import {
  create,
  getMine,
  getOne,
  update,
  remove,
} from "../controllers/listing.controller"

const router = Router()

router.get("/mine", authenticate, getMine)
router.get("/:id", getOne)
router.post("/", authenticate, validate(createListingSchema), create)
router.put("/:id", authenticate, validate(updateListingSchema), update)
router.delete("/:id", authenticate, remove)

export default router
