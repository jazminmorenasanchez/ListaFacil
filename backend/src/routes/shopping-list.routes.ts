import { Router } from 'express'
import * as shoppingListController from '../controllers/shopping-list.controller'
import { authenticate } from '../middlewares/auth.middleware'

export const shoppingListRouter = Router()

shoppingListRouter.use(authenticate)
shoppingListRouter.get('/', shoppingListController.list)
shoppingListRouter.post('/items', shoppingListController.add)
shoppingListRouter.patch('/items/:itemId', shoppingListController.update)
shoppingListRouter.delete('/items/:itemId', shoppingListController.remove)
