import mongoose from "mongoose"


  const  connectDB = async () => {
    try{
      await mongoose.connect(process.env.DB)
console.log("DB connected")
    }
    catch(err){
        console.error("Error connecting to DB:", err)
        throw err
    }}
export default connectDB