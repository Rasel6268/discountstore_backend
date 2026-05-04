const express = require('express')
const cors = require('cors')
const connectDb = require('./config/db')
const cookieParser = require('cookie-parser')
const app = express()
const categoryRoutes = require('./routers/category.route')
const brandRoutes = require('./routers/brand.route')

const allowedOrigins = [
  'http://localhost:3000',
  'https://discount-mart-system-frontend.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json())
app.use(cookieParser());

//connect to database
connectDb()

app.get('/',(req,res) =>{
    res.send('Your server is cooking')
})

//routers
app.use('/auth', require('./routers/auth.route'))
app.use('/categories', categoryRoutes);
app.use('/brands',brandRoutes)

module.exports = app
