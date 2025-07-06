import jwt from 'jsonwebtoken';
import User from '../models/auth.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized No access-token provided" });
        }
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.userId).select("-password"); 
        if (!user) {
            return res.status(401).json({ message: "Unauthorized User not found" });
        }
        req.user = user;
        next();
        
    } catch (error) {
        res.status(401).json({ message: "Unauthorized access" });
        
    }
}

export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Forbidden Access denied - Admin Only" });
    }
};