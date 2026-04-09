const mongoose = require('mongoose')

const connectDb= async() => {
    try {
        await mongoose.connect(process.env.MONGO_URL,{
            dbName: "discount_mart_db"
        })
        console.log('Mongodb Dd connection successfull !')
    } catch (error) {
        console.log(error)
    }

}

module.exports = connectDb