import "dotenv/config"
import express from "express"
import cors from "cors"
import dns from "node:dns"
import { connectDB } from "./config/db"
import authRouter from "./routes/auth.routes"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("StudyLink API is running")
})

app.use("/api/v1/auth", authRouter)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(5000, () => {
      console.log("Server running on http://localhost:5000")
    })
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message)
    process.exit(1)
  })
