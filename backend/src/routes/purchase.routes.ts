import { Router } from 'express'
import * as purchaseController from '../controllers/purchase.controller'
import { authenticate } from '../middlewares/auth.middleware'

export const purchaseRouter = Router()

purchaseRouter.use(authenticate)
purchaseRouter.post('/', purchaseController.schedule)
purchaseRouter.get('/active', purchaseController.active)
purchaseRouter.patch('/responsible', purchaseController.changeResponsible)
purchaseRouter.post('/postpone', purchaseController.postpone)
purchaseRouter.post('/release', purchaseController.release)
purchaseRouter.post('/start', purchaseController.start)
purchaseRouter.patch('/items/:itemId', purchaseController.updateItem)
purchaseRouter.post('/finish', purchaseController.finish)
