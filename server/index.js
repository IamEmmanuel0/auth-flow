require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const profileRoutes = require('./routes/profile')
const { initDB } = require('./config/database')
const authenticateToken = require('./middleware')
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(express.json())
app.use(cors())

initDB()

app.get('/', (req, res) => {
  res.status(200).json({message: 'Server is running...', success: true})
})

app.use('/auth', authRoutes)
app.use('/profile', authenticateToken, profileRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
