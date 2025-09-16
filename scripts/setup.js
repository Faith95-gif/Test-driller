const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Subject = require('../models/Subject');
const Question = require('../models/Question');

async function setupDatabase() {
    try {
        console.log('Setting up database...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamb_cbt', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Connected to MongoDB');
        
        // Create indexes
        await User.createIndexes();
        await Subject.createIndexes();
        await Question.createIndexes();
        
        console.log('Database indexes created');
        
        // Check if admin user exists
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            // Create default admin user
            const adminUser = new User({
                fullName: 'Admin User',
                email: 'admin@jambcbt.com',
                password: 'admin123',
                role: 'admin',
                subscriptionStatus: 'premium'
            });
            
            await adminUser.save();
            console.log('Default admin user created');
            console.log('Email: admin@jambcbt.com');
            console.log('Password: admin123');
        }
        
        console.log('Database setup completed!');
        
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        mongoose.connection.close();
    }
}

setupDatabase();