import "dotenv/config"
import express from "express"
import cors from "cors"
import dns from "node:dns"
import { connectDB } from "./config/db"
import authRouter from "./routes/auth.routes"
import catalogRouter from "./routes/catalog.routes"
import adminRouter from "./routes/admin.routes"
import listingRouter from "./routes/listing.routes"
import { notFound, errorHandler } from "./middleware/error.middleware"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("StudyLink API is running")
})

app.use("/api/v1/auth", authRouter)
app.use("/api/v1", catalogRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/listings", listingRouter)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message)
    process.exit(1)
  })
