import { Request, Response } from "express"
import * as catalog from "../services/catalog.service"
import { sendSuccess } from "../utils/response"

// public
export const getSubjects = async (_req: Request, res: Response) => {
  sendSuccess(res, 200, "Subjects fetched", await catalog.listSubjects())
}

export const getGradeLevels = async (_req: Request, res: Response) => {
  sendSuccess(res, 200, "Grade levels fetched", await catalog.listGradeLevels())
}

// admin - subjects
export const adminGetSubjects = async (_req: Request, res: Response) => {
  sendSuccess(res, 200, "Subjects fetched", await catalog.listSubjects(true))
}

export const adminCreateSubject = async (req: Request, res: Response) => {
  sendSuccess(
    res,
    201,
    "Subject created",
    await catalog.createSubject(req.body),
  )
}

export const adminUpdateSubject = async (req: Request, res: Response) => {
  sendSuccess(
    res,
    200,
    "Subject updated",
    await catalog.updateSubject(String(req.params.id), req.body),
  )
}

export const adminDeactivateSubject = async (req: Request, res: Response) => {
  sendSuccess(
    res,
    200,
    "Subject deactivated",
    await catalog.deactivateSubject(String(req.params.id)),
  )
}

// admin - grade levels
export const adminGetGradeLevels = async (_req: Request, res: Response) => {
  sendSuccess(
    res,
    200,
    "Grade levels fetched",
    await catalog.listGradeLevels(true),
  )
}

export const adminCreateGradeLevel = async (req: Request, res: Response) => {
  sendSuccess(
    res,
    201,
    "Grade level created",
    await catalog.createGradeLevel(req.body),
  )
}

export const adminUpdateGradeLevel = async (req: Request, res: Response) => {
  sendSuccess(
    res,
    200,
    "Grade level updated",
    await catalog.updateGradeLevel(String(req.params.id), req.body),
  )
}

export const adminDeactivateGradeLevel = async (
  req: Request,
  res: Response,
) => {
  sendSuccess(
    res,
    200,
    "Grade level deactivated",
    await catalog.deactivateGradeLevel(String(req.params.id)),
  )
}
