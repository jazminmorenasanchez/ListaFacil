import { Router } from 'express'
import * as catalogController from '../controllers/catalog.controller'
import { authenticate } from '../middlewares/auth.middleware'

export const catalogRouter = Router()

catalogRouter.use(authenticate)
catalogRouter.get('/', catalogController.list)
catalogRouter.post('/', catalogController.create)
catalogRouter.patch('/:itemId', catalogController.update)
catalogRouter.delete('/:itemId', catalogController.remove)
