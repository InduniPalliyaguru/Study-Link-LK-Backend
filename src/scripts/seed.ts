import "dotenv/config"
import dns from "node:dns"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { connectDB } from "../config/db"
import { Subject } from "../models/subject.model"
import { GradeLevel } from "../models/gradeLevel.model"
import { User, UserRole } from "../models/user.model"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const subjects = [
  "Combined Maths",
  "Chemistry",
  "ICT",
  "Biology",
  "O/L Science",
  "Physics",
  "Accounting",
]

const gradeLevels = [
  { name: "O/L", description: "Grade 10-11" },
  { name: "A/L", description: "Grade 12-13" },
  { name: "University", description: "Degree programmes" },
  { name: "Diploma", description: "Higher diploma" },
]

const run = async () => {
  await connectDB()

  for (const [index, name] of subjects.entries()) {
    await Subject.updateOne(
      { name },
      { $setOnInsert: { name, colorKey: index } },
      { upsert: true },
    )
  }
  console.log("Subjects ready")

  for (const level of gradeLevels) {
    await GradeLevel.updateOne(
      { name: level.name },
      { $setOnInsert: level },
      { upsert: true },
    )
  }
  console.log("Grade levels ready")

  const email = process.env.ADMIN_EMAIL?.toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (email && password) {
    const existing = await User.findOne({ email }).setOptions({
      withDeleted: true,
    })

    if (existing) {
      console.log("Admin account already exists")
    } else {
      await User.create({
        name: "Admin",
        email,
        password: await bcrypt.hash(password, 10),
        role: UserRole.ADMIN,
        district: "Colombo",
      })
      console.log("Admin account created")
    }
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipped admin account")
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
