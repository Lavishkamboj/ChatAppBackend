const mongoose= require('mongoose')
require('dotenv').config();

const connection = mongoose
  .connect(
   "mongodb+srv://lavishkamboj16:lavishkamboj16...@cluster0.1dmvo.mongodb.net/ChatApp?retryWrites=true&w=majority"
  )
  .then(() => console.log(" Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB connection error:", err));

module.exports = connection;
