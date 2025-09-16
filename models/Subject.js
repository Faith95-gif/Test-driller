const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    topics: [{
        name: String,
        description: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subject', SubjectSchema);