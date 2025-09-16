const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists, is active, and is admin
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = adminAuth;