const mongoose = require('mongoose');

const ExamResultSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    examType: {
        type: String,
        enum: ['practice', 'exam'],
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    questions: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedAnswer: {
            type: String,
            enum: ['A', 'B', 'C', 'D'],
            required: true
        },
        correctAnswer: {
            type: String,
            enum: ['A', 'B', 'C', 'D'],
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        },
        timeSpent: {
            type: Number, // in seconds
            default: 0
        }
    }],
    totalQuestions: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        required: true
    },
    score: {
        type: Number, // percentage
        required: true
    },
    timeUsed: {
        type: Number, // in seconds
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for efficient querying
ExamResultSchema.index({ user: 1, subject: 1, completedAt: -1 });

module.exports = mongoose.model('ExamResult', ExamResultSchema);