import mongoose from "mongoose";
const {Schema} = mongoose
const users =  new Schema({
    name:{
        type:String,
        required: true,
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
          type:String,
           required:true,

    },
    role:{
        type:String,
        default:"user",
        enum:["user","admin"]
    },
verified: {
  type: Boolean,
  default: false,
},
loginOtp: {
  type: String,
},
loginOtpExpires: {
  type: Date,
},  
},
      { timestamps: true },
    
);
export const user = mongoose.model("users",users);