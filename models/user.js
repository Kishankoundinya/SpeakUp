const mongoose =require("mongoose");

mongoose.connect(process.env.mongoURL)
.then((res)=>{
    console.log("connection established");
})

const userSchema=mongoose.Schema({
    Name:String,
    Username:String,
    Password:String,
    Email:String,
})

module.exports=mongoose.model('user',userSchema);