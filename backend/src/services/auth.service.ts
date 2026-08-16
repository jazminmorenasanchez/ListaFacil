import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Prisma, UserRole } from '../generated/prisma/client'
import { AppError } from '../lib/app-error'
import { prisma } from '../lib/prisma'

const BCRYPT_ROUNDS = 12
const TOKEN_EXPIRATION = '1h'

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  householdId: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>

interface RegisterInput {
  name: string
  email: string
  password: string
}

interface LoginInput {
  email: string
  password: string
}

interface AuthResult {
  user: SafeUser
  token: string
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET no está definida')
  }

  return secret
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new AppError(400, 'La contraseña debe tener al menos 8 caracteres')
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError(400, 'La contraseña es demasiado larga')
  }
}

function createToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: TOKEN_EXPIRATION })
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const name = input.name.trim()
  const email = normalizeEmail(input.email)

  if (!name || name.length > 100) {
    throw new AppError(400, 'El nombre es obligatorio y debe tener hasta 100 caracteres')
  }

  if (!validateEmail(email)) {
    throw new AppError(400, 'El email no es válido')
  }

  validatePassword(input.password)

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.MEMBER,
        householdId: null,
      },
      select: safeUserSelect,
    })

    return { user, token: createToken(user.id) }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, 'El email ya está registrado')
    }

    throw error
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email)
  const invalidCredentials = new AppError(401, 'Credenciales inválidas')

  if (!validateEmail(email) || !input.password) {
    throw invalidCredentials
  }

  const userWithPassword = await prisma.user.findUnique({ where: { email } })

  if (!userWithPassword) {
    throw invalidCredentials
  }

  const passwordMatches = await bcrypt.compare(input.password, userWithPassword.passwordHash)

  if (!passwordMatches) {
    throw invalidCredentials
  }

  const { passwordHash: _passwordHash, ...user } = userWithPassword
  return { user, token: createToken(user.id) }
}

export async function findSafeUserById(userId: string): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  })
}

export function verifyToken(token: string): string {
  try {
    const payload = jwt.verify(token, getJwtSecret())

    if (typeof payload === 'string' || typeof payload.userId !== 'string') {
      throw new Error('Payload inválido')
    }

    return payload.userId
  } catch {
    throw new AppError(401, 'Token inválido o expirado')
  }
}
