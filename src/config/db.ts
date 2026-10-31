import mongoose from "mongoose"

let connecting: Promise<unknown> | null = null

export const connectDB = async () => {
  const url = process.env.MONGO_URL

  if (!url) {
    throw new Error("MONGO_URL is missing in the .env file")
  }

  if (mongoose.connection.readyState === 1) {
    return
  }

  if (!connecting) {
    connecting = mongoose
      .connect(url)
      .then(() => console.log("MongoDB connected"))
      .catch((error) => {
        connecting = null
        throw error
      })
  }

  await connecting
}
