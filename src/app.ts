import express from "express"
import cors from "cors"
import authRouter from "./routes/auth.routes"
import catalogRouter from "./routes/catalog.routes"
import adminRouter from "./routes/admin.routes"
import listingRouter from "./routes/listing.routes"
import requestRouter from "./routes/request.routes"
import reviewRouter from "./routes/review.routes"
import userRouter from "./routes/user.routes"
import reportRouter from "./routes/report.routes"
import savedRouter from "./routes/saved.routes"
import meetupRouter from "./routes/meetup.routes"
import cronRouter from "./routes/cron.routes"
import aiRouter from "./routes/ai.routes"
import { notFound, errorHandler } from "./middleware/error.middleware"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/api", (_req, res) => {
  res.send("StudyLink API is running")
})

app.use("/api/v1/auth", authRouter)
app.use("/api/v1", catalogRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/listings", listingRouter)
app.use("/api/v1/requests", requestRouter)
app.use("/api/v1/reviews", reviewRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/reports", reportRouter)
app.use("/api/v1/saved", savedRouter)
app.use("/api/v1/ai", aiRouter)
app.use("/api/v1/meetup-points", meetupRouter)
app.use("/api/v1/cron", cronRouter)

app.use(notFound)
app.use(errorHandler)

export default app