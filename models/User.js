const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscriptionStatus: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free'
    },
    activationKey: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

// Hash password before updating
UserSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    if (update.password) {
        try {
            update.password = await bcrypt.hash(update.password, 12);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Ensure email is lowercase before saving
UserSchema.pre('save', function(next) {
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);