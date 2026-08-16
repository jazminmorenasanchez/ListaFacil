import { Router } from 'express'
import * as householdController from '../controllers/household.controller'
import { authenticate } from '../middlewares/auth.middleware'

export const householdRouter = Router()

householdRouter.use(authenticate)
householdRouter.post('/', householdController.create)
householdRouter.post('/join', householdController.join)
householdRouter.get('/current', householdController.current)
householdRouter.get('/members', householdController.members)
householdRouter.post('/leave', householdController.leave)
householdRouter.delete('/members/:userId', householdController.removeMember)
householdRouter.post('/regenerate-code', householdController.regenerateCode)
