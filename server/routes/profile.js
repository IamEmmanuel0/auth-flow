const express = require('express')
const bcrypt = require('bcrypt')
const { pool } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const query = 'SELECT id, email, name, age, field, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({ user: result.rows[0] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

router.put('/', async (req, res) => {
  try {
    const { name, age, field } = req.body;

    const query = `
      UPDATE users SET name = $1, age = $2, field = $3
      WHERE id = $4 RETURNING id;
    `;
    const result = await pool.query(query, [name, age, field, req.user.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({ message: 'Profile update successfully', id: result.rows[0].id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

router.patch("/change-password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ error: "Old and new passwords are required" })
    
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id])
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword)
      return res.status(401).json({ error: 'Old password is incorrect' })
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id])
    
    res.json({message: 'password changed successfully'})
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }})

module.exports = router;
