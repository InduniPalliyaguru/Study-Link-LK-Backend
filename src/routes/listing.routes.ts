import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { upload } from "../middleware/upload.middleware"
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
  search,
} from "../controllers/listing.controller"

const router = Router()

router.get("/", search)
router.get("/mine", authenticate, getMine)
router.get("/:id", getOne)
router.post(
  "/",
  authenticate,
  upload.array("images", 4),
  validate(createListingSchema),
  create,
)
router.put(
  "/:id",
  authenticate,
  upload.array("images", 4),
  validate(updateListingSchema),
  update,
)
router.delete("/:id", authenticate, remove)

export default router
