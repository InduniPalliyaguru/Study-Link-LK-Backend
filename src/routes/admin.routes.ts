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
  getRequests,
  getStats,
} from "../controllers/admin.controller"
import { resolveReportSchema } from "../validators/report.validator"
import {
  adminGetReports,
  adminResolveReport,
} from "../controllers/report.controller"
import {
  createMeetupPointSchema,
  updateMeetupPointSchema,
} from "../validators/meetup.validator"
import {
  adminGetPoints,
  adminCreatePoint,
  adminUpdatePoint,
  adminDeactivatePoint,
} from "../controllers/meetup.controller"

const router = Router()

// every route below needs a logged-in ADMIN
router.use(authenticate, requireRole(UserRole.ADMIN))

router.get("/stats", getStats)

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

// requests (monitoring)
router.get("/requests", getRequests)

// meet-up points
router.get("/meetup-points", adminGetPoints)
router.post(
  "/meetup-points",
  validate(createMeetupPointSchema),
  adminCreatePoint,
)
router.put(
  "/meetup-points/:id",
  validate(updateMeetupPointSchema),
  adminUpdatePoint,
)
router.delete("/meetup-points/:id", adminDeactivatePoint)

export default router
