import "dotenv/config"
import dns from "node:dns"
import mongoose from "mongoose"
import { connectDB } from "../config/db"
import {
  Listing,
  ListingCondition,
  ListingStatus,
  DeliveryOption,
} from "../models/listing.model"
import { Subject } from "../models/subject.model"
import { GradeLevel } from "../models/gradeLevel.model"
import { User } from "../models/user.model"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const samples: [string, string, string, number, ListingCondition, string][] = [
  [
    "Combined Maths Part I - A/L",
    "Combined Maths",
    "A/L",
    1800,
    ListingCondition.GOOD,
    "Galle",
  ],
  [
    "Combined Maths Part II - A/L",
    "Combined Maths",
    "A/L",
    1900,
    ListingCondition.GOOD,
    "Galle",
  ],
  [
    "Chemistry Past Papers 2015-2023",
    "Chemistry",
    "A/L",
    950,
    ListingCondition.FAIR,
    "Colombo",
  ],
  [
    "ICT Short Notes (Sinhala)",
    "ICT",
    "A/L",
    1100,
    ListingCondition.NEW,
    "Kandy",
  ],
  [
    "Biology Paper Class Notes",
    "Biology",
    "A/L",
    1200,
    ListingCondition.GOOD,
    "Matara",
  ],
  [
    "O/L Science Revision Pack",
    "O/L Science",
    "O/L",
    700,
    ListingCondition.GOOD,
    "Kurunegala",
  ],
  [
    "Physics Mechanics Notes",
    "Physics",
    "A/L",
    1500,
    ListingCondition.GOOD,
    "Galle",
  ],
  [
    "Accounting Model Papers",
    "Accounting",
    "A/L",
    850,
    ListingCondition.FAIR,
    "Gampaha",
  ],
  [
    "Free Chemistry Organic Notes",
    "Chemistry",
    "A/L",
    0,
    ListingCondition.FAIR,
    "Colombo",
  ],
  [
    "Free O/L Maths Workbook",
    "Combined Maths",
    "O/L",
    0,
    ListingCondition.GOOD,
    "Matara",
  ],
]

const deliveryCycle = [
  DeliveryOption.BOTH,
  DeliveryOption.MEETUP,
  DeliveryOption.COURIER,
]

const run = async () => {
  await connectDB()

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  const seller = adminEmail ? await User.findOne({ email: adminEmail }) : null

  if (!seller) {
    console.log("Admin user not found. Run `npm run seed` first.")
    await mongoose.disconnect()
    return
  }

  for (const [
    index,
    [title, subjectName, gradeName, price, condition, district],
  ] of samples.entries()) {
    const subject = await Subject.findOne({ name: subjectName })
    const gradeLevel = await GradeLevel.findOne({ name: gradeName })

    if (!subject || !gradeLevel) {
      console.log(`Skipped "${title}" (subject or grade level missing)`)
      continue
    }

    await Listing.updateOne(
      { title, seller: seller._id },
      {
        $setOnInsert: {
          title,
          description: `Sample listing for development: ${title}.`,
          price,
          condition,
          district,
          deliveryOptions: deliveryCycle[index % deliveryCycle.length],
          images: [],
          status: ListingStatus.AVAILABLE,
          seller: seller._id,
          subject: subject._id,
          gradeLevel: gradeLevel._id,
        },
      },
      { upsert: true },
    )
  }

  console.log("Sample listings ready")
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
