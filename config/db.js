const mongoose= require('mongoose')
require('dotenv').config();

const connection = mongoose
  .connect(
   process.env.MONGO_URI
  )
  .then(() => console.log(" Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB connection error:", err));

module.exports = connection;