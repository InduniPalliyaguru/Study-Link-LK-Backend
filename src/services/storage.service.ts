import crypto from "node:crypto"
import { supabase, BUCKET } from "../config/supabase"
import { ApiError } from "../utils/ApiError"

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export const removeImages = async (urls: string[]) => {
  const marker = `/object/public/${BUCKET}/`
  const paths = urls.map((url) => url.split(marker)[1]).filter(Boolean) as string[]

  if (paths.length === 0) return

  try {
    await supabase.storage.from(BUCKET).remove(paths)
  } catch (err) {
    console.error("Failed to remove images from storage:", err)
  }
}

export const uploadImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  const urls: string[] = []

  try {
    for (const file of files) {
      const ext = extensions[file.mimetype] ?? "jpg"
      const filePath = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

      if (error) {
        throw new ApiError(502, `Image upload failed: ${error.message}`)
      }

      urls.push(supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl)
    }

    return urls
  } catch (err) {
    await removeImages(urls)
    throw err
  }
}