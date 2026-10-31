import { Router } from "express"
import { autoCompleteShippedRequests } from "../services/request.service"
import { ApiError } from "../utils/ApiError"
import { sendSuccess } from "../utils/response"

const router = Router()

router.get("/auto-complete", async (req, res) => {
  const secret = process.env.CRON_SECRET

  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    throw new ApiError(401, "Unauthorized")
  }

  const count = await autoCompleteShippedRequests()
  sendSuccess(res, 200, "Auto-complete finished", { completed: count })
})

export default router
