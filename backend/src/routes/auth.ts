import { Router, Response } from 'express'
import bcrypt from 'bcrypt'
import { pool } from '../index.js'
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email.toLowerCase(), passwordHash, name || null]
    )

    const user = result.rows[0]
    const token = generateToken({ id: user.id, email: user.email })

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Find user
    const result = await pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = generateToken({ id: user.id, email: user.email })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user!.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

export default router
