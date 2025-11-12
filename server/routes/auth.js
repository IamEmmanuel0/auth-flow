require('dotenv').config()
const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { pool } = require('../config/database')
const { sendResetPassword } = require('../config/email')

const router = express.Router();

router.post('/sign-up', async (req, res) => {
  try {
    const { name, email, password, age, field } = req.body
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name or password are required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const query = `
      INSERT INTO users (email, name, password, age, field)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(query, [email, name, hashedPassword, age || 0, field || 'Backend'])

    res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' })
    }
    console.error(error)
    res.status(500).json({ error: "server error" })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: '30d' })
    res.json({ message: 'Login successful', token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" })

    const result =
      await pool.query('SELECT id, email FROM users WHERE email = $1', [email])
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'No account found with this email' })

    const user = result.rows[0];
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: '15m' }
    )

    await pool.query(
      'UPDATE users SET reset_token =$1 WHERE email = $2', [resetToken, email]
    )

    // send an email to the user
    const emailResult =await sendResetPassword(email, resetToken)

    if (!emailResult.success) {
      return res.status(500).json({error: "Failed to send email, Please try again later."})
    }

    res.json({ message: "Password reset link had been sent your email" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token and new password are required' })
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY)
    } catch (error) {
      return res.status(400).json({error: 'Invalid or expired token'})
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1 AND reset_token = $2',
      [decoded.id, token])

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await pool.query('UPDATE users SET password = $1, reset_token = NULL WHERE id = $2',
      [hashedPassword, decoded.id])

    res.status(200).json({message: 'Password reset successful'})
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router;