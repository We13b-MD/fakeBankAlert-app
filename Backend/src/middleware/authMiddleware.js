 import jwt from 'jsonwebtoken'
 import User from '../models/User.js'

 export const protect = async (req,res,next) =>{

    let token;

    if(
        req.headers.authorization && req.headers.authorization.startsWith('Bearer')
    ){
        token = req.headers.authorization.split(' ')[1];
    }

   if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
}

    try{

      //console.log('Authorization header:', req.headers.authorization);
console.log('Token:', token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        //Attach user to request, exclusind password 

        req.user = await User.findById(decoded.id).select('-password');

       
console.log('Decoded token:', decoded);

        next()
    }catch(err){
        return res.status(401).json({message:'Not authorized token invalid '})
    }
 }

 //Middleware to restsrict routes to specific roles

 export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role '${req.user.role}' not authorized` });
    }
    next(); // Important!
  };
};


