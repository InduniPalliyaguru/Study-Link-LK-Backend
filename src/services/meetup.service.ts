import { MeetupPoint } from "../models/meetupPoint.model"
import { ApiError } from "../utils/ApiError"
import { escapeRegex } from "../utils/escapeRegex"
import {
  CreateMeetupPointInput,
  UpdateMeetupPointInput,
} from "../validators/meetup.validator"

export const listMeetupPoints = (
  district?: string,
  includeInactive = false,
) => {
  const filter: Record<string, unknown> = {}

  if (!includeInactive) filter.isActive = true
  if (district) filter.district = new RegExp(`^${escapeRegex(district)}$`, "i")

  return MeetupPoint.find(filter).sort({ district: 1, name: 1 })
}

export const createMeetupPoint = (input: CreateMeetupPointInput) => {
  return MeetupPoint.create(input)
}

export const updateMeetupPoint = async (
  id: string,
  input: UpdateMeetupPointInput,
) => {
  const point = await MeetupPoint.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  })

  if (!point) {
    throw new ApiError(404, "Meet-up point not found")
  }

  return point
}

export const deactivateMeetupPoint = async (id: string) => {
  const point = await MeetupPoint.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  )

  if (!point) {
    throw new ApiError(404, "Meet-up point not found")
  }

  return point
}
