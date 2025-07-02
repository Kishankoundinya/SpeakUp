const mongoose =require("mongoose");

const postSchema=mongoose.Schema({
  user:{
    type:mongoose. Schema. Types. ObjectId,
    ref:"user"
  },
      username: {  
        type: String,
        required: true
    },
  date:{
    type:Date,
    default:Date.now,
   

  },
  content:{
     type:String,
     required:true
  },
  
   


})

module.exports=mongoose.model('post',postSchema);
