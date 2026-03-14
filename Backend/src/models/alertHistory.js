import mongoose from 'mongoose'

const alertHistorySchema = new mongoose.Schema(
    {
  user: {
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true,
    index:true
  },
  source:{
    type:String,
    enum:['text','image'],
    required:true
  },

  originalInput:{
    type:String,
    required:true
    //
  },
  extractedText:{
    type:String
  },

  verdict:{
    type:String,
    enum:['real', 'likely_fake', 'fake', 'suspicious'],
    required:true
  },
  confidence:{
    type:Number,
    min:0,
    max:1,
    required:true
  },
  detectFields:{
    bank:String,
    amount:String,
    account:String,
    reference:String
  },

  warnings:{
    type:[String],
    default:[]
  },

  metadata:{
    ip:String,
    userAgent:String
  }

    },

    {
        timestamps:true
    }
  
)

export default mongoose.model('AlertHistory', alertHistorySchema)