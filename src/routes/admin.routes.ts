import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"
import { validate } from "../middleware/validate.middleware"
import { UserRole } from "../models/user.model"
import {
  createSubjectSchema,
  updateSubjectSchema,
  createGradeLevelSchema,
  updateGradeLevelSchema,
} from "../validators/catalog.validator"
import {
  adminGetSubjects,
  adminCreateSubject,
  adminUpdateSubject,
  adminDeactivateSubject,
  adminGetGradeLevels,
  adminCreateGradeLevel,
  adminUpdateGradeLevel,
  adminDeactivateGradeLevel,
} from "../controllers/catalog.controller"

const router = Router()

// every route below needs a logged-in ADMIN
router.use(authenticate, requireRole(UserRole.ADMIN))

router.get("/subjects", adminGetSubjects)
router.post("/subjects", validate(createSubjectSchema), adminCreateSubject)
router.put("/subjects/:id", validate(updateSubjectSchema), adminUpdateSubject)
router.delete("/subjects/:id", adminDeactivateSubject)

router.get("/grade-levels", adminGetGradeLevels)
router.post(
  "/grade-levels",
  validate(createGradeLevelSchema),
  adminCreateGradeLevel,
)
router.put(
  "/grade-levels/:id",
  validate(updateGradeLevelSchema),
  adminUpdateGradeLevel,
)
router.delete("/grade-levels/:id", adminDeactivateGradeLevel)

export default router
