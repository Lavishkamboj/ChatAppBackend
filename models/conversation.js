const mongoose=require('mongoose')
const userConversation= new mongoose.Schema({
  participants: [
      {//this participants is just an array which can store any no. of users, with type- id, ref- so that using populate methd u can fetch data from other collection(user colelcton)
        type: String,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
})
const conversationModel=mongoose.model('conversation', userConversation);
module.exports=conversationModel;