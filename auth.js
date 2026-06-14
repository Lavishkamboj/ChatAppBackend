const jwt = require('jsonwebtoken');


const requireAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({msg:'Access denied. No token provided.'});
  }

  try {
    const decoded = jwt.verify(token, process.env.jwt_secret);
    req.user = decoded; // make user info available in req
   
    next();
    
  } catch (err) {
    return res.status(400).json({error:'Invalid token.'});
  }
};
module.exports=requireAuth;