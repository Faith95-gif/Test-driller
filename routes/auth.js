const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        
        res.status(500).json({ message: 'Server error during registration. Please try again.' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(400).json({ message: 'Account is deactivated. Contact admin.' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login. Please try again.' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Activate premium subscription
router.post('/activate', auth, async (req, res) => {
    try {
        const { activationKey } = req.body;

        if (!activationKey) {
            return res.status(400).json({ message: 'Please provide activation key' });
        }

        // Simple activation key validation (in production, use proper key validation)
        const validKeys = ['JAMB2024PREMIUM', 'PREMIUM2024', 'TESTKEY123'];
        
        if (validKeys.includes(activationKey.toUpperCase())) {
            const updatedUser = await User.findByIdAndUpdate(
                req.user.userId, 
                {
                    subscriptionStatus: 'premium',
                    activationKey: activationKey.toUpperCase()
                },
                { new: true }
            );

            res.json({ 
                message: 'Premium subscription activated successfully',
                user: {
                    id: updatedUser._id,
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    subscriptionStatus: updatedUser.subscriptionStatus
                }
            });
        } else {
            res.status(400).json({ message: 'Invalid activation key' });
        }
    } catch (error) {
        console.error('Activation error:', error);
        res.status(500).json({ message: 'Server error during activation' });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error during password change' });
    }
});

module.exports = router;