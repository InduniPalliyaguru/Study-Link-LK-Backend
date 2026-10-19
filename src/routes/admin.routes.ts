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
  rejectListingSchema,
  blockUserSchema,
} from "../validators/admin.validator"
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
import {
  getListings,
  approve,
  reject,
  getUsers,
  blockUser,
  removeUser,
} from "../controllers/admin.controller"
import { resolveReportSchema } from "../validators/report.validator"
import {
  adminGetReports,
  adminResolveReport,
} from "../controllers/report.controller"

const router = Router()

// every route below needs a logged-in ADMIN
router.use(authenticate, requireRole(UserRole.ADMIN))

// subjects
router.get("/subjects", adminGetSubjects)
router.post("/subjects", validate(createSubjectSchema), adminCreateSubject)
router.put("/subjects/:id", validate(updateSubjectSchema), adminUpdateSubject)
router.delete("/subjects/:id", adminDeactivateSubject)

// grade levels
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

// listing moderation
router.get("/listings", getListings)
router.patch("/listings/:id/approve", approve)
router.patch("/listings/:id/reject", validate(rejectListingSchema), reject)

// users
router.get("/users", getUsers)
router.patch("/users/:id/block", validate(blockUserSchema), blockUser)
router.delete("/users/:id", removeUser)

// reports
router.get("/reports", adminGetReports)
router.patch("/reports/:id", validate(resolveReportSchema), adminResolveReport)

export default router
