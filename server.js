const express= require('express');
const app= express();
const fs = require("fs");
const auth=require('./auth')

// const cors= require('cors');
//socket io
const PORT = process.env.PORT || 5000;
const http= require('http');
const {Server}= require("socket.io");
const server=http.createServer(app);

require('dotenv').config()
const io= new Server(server,{
    cors:{
        origin:"https://chat-app-frontend-ten-neon.vercel.app",
        method:["get","post"],
        credentials:true
    }
})

const path =require("path");
let cors=require('cors')
//importing mongo models

const db=require('./config/db')
const userModel=require('./models/user')
const conversationModel=require('./models/conversation')
const messageModel=require('./models/message')


//for hashing and token generaton
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')

const cookieParser = require('cookie-parser')

app.use(cors({ // your React app
 origin: ['http://localhost:5173', 'https://chat-app-frontend-ten-neon.vercel.app'],
  credentials: true,         
}));

//middlewares
app.use(express.json());
app.use(cookieParser());

 app.get('/auth',auth,(req,res)=>{
       res.json({user:req.user.username})
    })
//handling rerqueest from endpoints
app.get('/', (req,res)=>{
   
    res.send("Hlo their how r u")
    console.log("brother server is running");
})

//login,signin,logout mechanism satrted
app.post('/sign-up',async(req,res)=>{
    const {username,password}=req.body
    console.log(req.body)
try{
const user=await userModel.findOne({username:req.body.username})
if(user){
   return res.status(409).send({message:"user already exixst"})
}

    const hash_pass=await bcrypt.hash(req.body.password,10)
   await userModel.create({username:req.body.username,password:hash_pass});

   const token=jwt.sign({
  username:req.body.username,
  password:req.body.password
},
process.env.JWT_SECRET
)
console.log("token-"+token)


res.cookie('token', token, {
  httpOnly: true,         // allow JS to access (optional)
  secure: true,           // must be true if you're on HTTPS
  sameSite: 'none',         // controls cross-origin cookie behavior
  path: '/',               // cookie available to all paths
  maxAge: 86400000         // 1 day
});

console.log('Cookie being set:', token);

   return res.json({
  message: "ok I got signup data",
});}
    catch(err){
          res.status(500).send(err.message)
    }
}


)

app.post('/login',async(req,res)=>{
     const { username, password } = req.body;
  console.log(username,password) 
  
  try {
    const user = await userModel.findOne({ username });
    if (!user) {
  
      return res.status(404).send({ message: 'User or password is incorrect' });
    }
    
    const isMatch=await bcrypt.compare(password,user.password)
    if (!isMatch) {
      return res.status(401).send({ message: 'User or password is incorrect' });

      
    }
    //making token
    const token=jwt.sign({
  username:username,
  password:password
},
process.env.JWT_SECRET
)
console.log("token-"+token)

//cookie
res.cookie('token', token, {
  httpOnly: true,         
  secure: true,           // must be true if you're on HTTPS
  sameSite: 'none',         // controls cross-origin cookie behavior
  path: '/',               // cookie available to all paths
  maxAge: 86400000         
});
console.log('Cookie being set:', token);

    //  Successful login
    res.send({ message: 'Login successful', username: { username: user.username } });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send({ message: 'Internal server error' });
  }
})
app.post('/logout',(req,res)=>{
    console.log('ok lets delete you token')
     res.clearCookie('token', {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
});
return res.json({ message: 'Logged out successfully' });
})

app.get("/users", async (req, res) => {
  try {
    const users = await userModel.find({}, "username"); // only fetch username field

    // convert to simple array of names
    const usernames = users.map((u) => u.username);

    res.json(usernames);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
app.post('/data', async (req, res) => {
  try {
    let token = req.cookies.token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
let conversationId=req.body.conv_id
console.log(conversationId)
    //rempving that readfile method to get conv id bcz whenever in the world new connection creates ,now conv id get formed and so other user suffer
// const raw = require("fs").readFileSync(path.join(__dirname, "conversation.json"), "utf8");
// conversationId = raw.trim().replace(/^"+|"+$/g, "");
const users=await conversationModel.findById(conversationId)
console.log(users)
    const messages = await messageModel.find({
      conversationId: conversationId
    }) .sort({ createdAt: 1 })
    if(!messages){
      console.log("their are 0 messages")
      return;
    }

    res.json({
      me: decoded.username,
      user1:users.participants[0],
      user2:users.participants[1],
      messages: messages
    })

  } catch (err) {
    res.status(500).send(err)
  }
})

//login,sign,logout mechanism ends here
const userSocketMap = {}; // { userId: socketId } its for - on message so that we can store who are online
//now whatever happens ,happnes using token and socket
app.post('/conversation',async(req,res)=>{
    try{

    
let token=req.cookies.token
if(!token){
  console.log("no token so no conv id")
  return res.status(500).json({msg:"no user logged in as thier is no token"})
}

    const decoded = jwt.verify(token, process.env.JWT_SECRET);//got logged in user details

console.log(decoded.username); //working fine 
// userSocketMap[username] = decoded.username;//here as we come to know about this user want to do conversation with other this means he is online so storing it here
console.log(req.body.username)//checking for other user detials
//checking them in mongodb
let conversation = await conversationModel.findOne({
  participants: {
    $all: [decoded.username, req.body.username]
  }
});

if (!conversation) {
  conversation = await conversationModel.create({
    participants: [decoded.username, req.body.username]
  });
}
let data=conversation._id
res.json({
  conv_id:data
})
// fs.writeFileSync("conversation.json", JSON.stringify(conversation._id));
//       return res.json({
//         message:"Coversation is made"
//       });
    }catch(err){
      res.status(500).send(err)
    }
})
//we want to give usernmae to our /conversation route but thats socket onnection not app.get/post, so to get user we cant do req.cookie thats why we first make app.get req at backened and it decodes the username and send it back and then frontend save it and pass it in auth ,so that now any socket request can access it. 
app.get('/me', (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'Not logged in' })
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  
  res.json({ username: decoded.username })
})
//handling socket io
//actually to get token or username using socket ,what we do- first of all if httonly then we cant access token form forntend so we first make a get  request to backeked and then backeed acccess the token using req.cookie and then send it bakc to frontend an dt then we send it back using socket to baackedd socket.
//whenever any socket requst is dont first this one calss then otehr
io.use((socket, next) => {
  const username = socket.handshake.auth.username
  const conv_id=socket.handshake.auth.conv_id
  socket.username = username
  socket.conv_id=conv_id
  next()
})

io.on("connection",async (socket)=>{
     console.log('connection made successfully')
    socket.emit("message", "system h")
    // Step 1: User joins their private room with another user
  socket.on("join_private_room", ({ myId, otherId }) => {
    
    // Always sort IDs so room name is same regardless of who initiates
    // e.g. users 101 & 202 always get room "101_202" not "202_101"
    const roomName = [myId, otherId].sort().join("_");
    
    socket.join(roomName);         // this socket joins the room
    socket.roomName = roomName;    // save it for later use
    
    console.log(`User ${myId} joined room: ${roomName}`);
  });

    socket.on('message',async (data)=>{
      
        console.log(data)
         const username = socket.username; 
         const conv_id=socket.conv_id;
         const msg_content=data;
     
        
      

//getting conv id,we will get of both users from here and message is coming from socket itself and so can be stored easily

//        const data=await fs.readFile(path.join(__dirname,"conversation.json"), "utf8", (err, data) => {
//     if (err) {
//         console.error(err);
//         return;
//     }

//     conv_id=JSON.parse(data)
//     const users= conversationModel.findById(conv_id);
//         console.log(users)
//    console.log(conv_id)
    
// });


//changed the file save methodd of conv_id to automatic
// const raw = require("fs").readFileSync(path.join(__dirname, "conversation.json"), "utf8");
// conv_id = raw.trim().replace(/^"+|"+$/g, "");

//sending the received msg from one user to other throug rooms
//  socket.to(socket.roomName).emit("receive_message", {
//       from: conv_id,
//       message: msg_content
//     });
socket.to(socket.roomName).emit("receive_message", {
  senderId: username,   // matches what frontend checks for alignment
  content: msg_content, //  matches what JSX renders
  conversationId: conv_id,
  
  
});
const user = await conversationModel.findById(conv_id);
if (!user) {
  console.error("No conversation found for ID:", conv_id);
  return; // ← stop execution, no crash
}
console.log(user);
// const sender=user.participants[0]

// const message=socket
//now saving message to mongo
            try{
                 const message = await messageModel.create({
       conversationId: conv_id,   // was: conv_id
    senderId: username,          // was: sender (wrong key name)
    content: data,  

      });

      console.log("Message saved:", message);

      // send to all users in that conversation room
      // io.to(conversationId).emit("receive_message", message);
            }
            catch(err){

                console.log(err);
            }

        })


})




//assigning port 
server.listen(PORT, ()=>{
    console.log("server started baby")
})

