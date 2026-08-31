import express from 'express'
import { authRouter } from './routes/auth.routes'
import { householdRouter } from './routes/household.routes'
import { catalogRouter } from './routes/catalog.routes'
import { shoppingListRouter } from './routes/shopping-list.routes'
import { purchaseRouter } from './routes/purchase.routes'
import { AppError } from './lib/app-error'

const app = express()
const port = Number(process.env.PORT) || 3000
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use((request, response, next) => {
  if (request.header('Origin') === frontendUrl) {
    response.header('Access-Control-Allow-Origin', frontendUrl)
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  }
  if (request.method === 'OPTIONS') { response.sendStatus(204); return }
  next()
})

app.use(express.json())

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/households', householdRouter)
app.use('/api/catalog', catalogRouter)
app.use('/api/shopping-list', shoppingListRouter)
app.use('/api/purchases', purchaseRouter)

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
import x from './no-existe';
