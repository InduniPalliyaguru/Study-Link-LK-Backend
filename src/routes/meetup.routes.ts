import { Router } from "express"
import { getPoints } from "../controllers/meetup.controller"

const router = Router()

router.get("/", getPoints)

export default router
