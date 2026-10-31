import "dotenv/config"
import dns from "node:dns"
import app from "./app"
import { connectDB } from "./config/db"
import { autoCompleteShippedRequests } from "./services/request.service"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)

      const runAutoComplete = () => {
        autoCompleteShippedRequests()
          .then((count) => {
            if (count > 0)
              console.log(`Auto-completed ${count} shipped request(s)`)
          })
          .catch((err) => console.error("Auto-complete failed:", err))
      }

      runAutoComplete()
      setInterval(runAutoComplete, 60 * 60 * 1000)
    })
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message)
    process.exit(1)
  })
