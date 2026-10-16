import express from "express"

const app = express()

app.get("/", (req, res) => {
    res.send("StudyLink API is running")
})

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000")
})