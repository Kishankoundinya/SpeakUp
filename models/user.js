const mongoose =require("mongoose");
/////////for online
mongoose.connect(process.env.mongoURL)
////////for offline
// mongoose.connect('mongodb://127.0.0.1:27017/Speakup')
// .then((res)=>{
//     console.log("connection established");
// })

const userSchema=mongoose.Schema({
    Name:String,
    Username:String,
    Password:String,
    Email:String,
   
    
})

module.exports=mongoose.model('user',userSchema);