import { Router } from "express"
import { getSubjects, getGradeLevels } from "../controllers/catalog.controller"

const router = Router()

router.get("/subjects", getSubjects)
router.get("/grade-levels", getGradeLevels)

export default router
