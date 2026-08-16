import express from 'express'
import { authRouter } from './routes/auth.routes'
import { householdRouter } from './routes/household.routes'
import { catalogRouter } from './routes/catalog.routes'
import { shoppingListRouter } from './routes/shopping-list.routes'
import { purchaseRouter } from './routes/purchase.routes'
import { AppError } from './lib/app-error'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(express.json())

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/auth', authRouter)
app.use('/households', householdRouter)
app.use('/catalog', catalogRouter)
app.use('/shopping-list', shoppingListRouter)
app.use('/purchases', purchaseRouter)

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message })
    return
  }

  console.error('Error inesperado', error)
  response.status(500).json({ message: 'Error interno del servidor' })
})

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`)
})
