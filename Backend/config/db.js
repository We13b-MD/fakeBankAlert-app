import mongoose from 'mongoose'

export async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Mongo Connected')
        console.log('Mongo URI:', process.env.MONGO_URI);
    }catch(err){
        console.log('Database Error:', err.message)
        process.exit(1)
    }
}