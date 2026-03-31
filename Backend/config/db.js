import mongoose from 'mongoose'

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Mongo Connected')
    } catch (err) {
        console.error('Database Error:', err.message)
        process.exit(1)
    }
}