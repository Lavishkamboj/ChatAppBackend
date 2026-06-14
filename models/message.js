const mongoose=require('mongoose')
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    senderId: {
      type: String,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

  },
  {
    timestamps: true, // createdAt acts as your message timestamp
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports=Message