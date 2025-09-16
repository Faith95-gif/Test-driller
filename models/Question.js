const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    year: {
        type: Number,
        required: true,
        min: 2010,
        max: new Date().getFullYear()
    },
    topic: {
        type: String,
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    options: [{
        label: {
            type: String,
            required: true,
            enum: ['A', 'B', 'C', 'D']
        },
        text: {
            type: String,
            required: true
        }
    }],
    correctAnswer: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    explanation: {
        type: String,
        default: ''
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for efficient querying
QuestionSchema.index({ subject: 1, year: 1, topic: 1 });

module.exports = mongoose.model('Question', QuestionSchema);