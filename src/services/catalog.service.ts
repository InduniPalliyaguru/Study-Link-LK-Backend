import { Subject } from "../models/subject.model"
import { GradeLevel } from "../models/gradeLevel.model"
import { ApiError } from "../utils/ApiError"
import {
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateGradeLevelInput,
  UpdateGradeLevelInput,
} from "../validators/catalog.validator"

export const listSubjects = (includeInactive = false) => {
  return Subject.find(includeInactive ? {} : { isActive: true }).sort({
    name: 1,
  })
}

export const createSubject = (input: CreateSubjectInput) => {
  return Subject.create(input)
}

export const updateSubject = async (id: string, input: UpdateSubjectInput) => {
  const subject = await Subject.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  })
  if (!subject) {
    throw new ApiError(404, "Subject not found")
  }
  return subject
}

export const deactivateSubject = async (id: string) => {
  const subject = await Subject.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  )
  if (!subject) {
    throw new ApiError(404, "Subject not found")
  }
  return subject
}

export const listGradeLevels = (includeInactive = false) => {
  return GradeLevel.find(includeInactive ? {} : { isActive: true }).sort({
    name: 1,
  })
}

export const createGradeLevel = (input: CreateGradeLevelInput) => {
  return GradeLevel.create(input)
}

export const updateGradeLevel = async (
  id: string,
  input: UpdateGradeLevelInput,
) => {
  const gradeLevel = await GradeLevel.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  })
  if (!gradeLevel) {
    throw new ApiError(404, "Grade level not found")
  }
  return gradeLevel
}

export const deactivateGradeLevel = async (id: string) => {
  const gradeLevel = await GradeLevel.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  )
  if (!gradeLevel) {
    throw new ApiError(404, "Grade level not found")
  }
  return gradeLevel
}
