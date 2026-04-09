const express = require('express')
const cors = require('cors')
const connectDb = require('./config/db')
const app = express()

//middleware
app.use(cors())
app.use(express.json())

//connect to database
connectDb()

app.get('/',(req,res) =>{
    res.send('Your server is cooking')
})

//routers
app.use('/auth', require('./routers/auth.route'))

module.exports = app
