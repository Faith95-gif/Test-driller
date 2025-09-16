const express = require('express');
const ExamResult = require('../models/ExamResult');
const Question = require('../models/Question');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit exam result
router.post('/submit', auth, async (req, res) => {
    try {
        const {
            subject,
            examType,
            year,
            answers,
            timeUsed
        } = req.body;

        // Get questions with correct answers
        const questionIds = answers.map(answer => answer.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });

        // Calculate results
        const examQuestions = [];
        let correctAnswers = 0;

        for (const answer of answers) {
            const question = questions.find(q => q._id.toString() === answer.questionId);
            const isCorrect = question.correctAnswer === answer.selectedAnswer;
            
            if (isCorrect) correctAnswers++;

            examQuestions.push({
                question: question._id,
                selectedAnswer: answer.selectedAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                timeSpent: answer.timeSpent || 0
            });
        }

        const score = Math.round((correctAnswers / questions.length) * 100);

        // Save exam result
        const examResult = new ExamResult({
            user: req.user.userId,
            subject,
            examType,
            year,
            questions: examQuestions,
            totalQuestions: questions.length,
            correctAnswers,
            score,
            timeUsed
        });

        await examResult.save();

        res.json({
            message: 'Exam submitted successfully',
            result: {
                id: examResult._id,
                score,
                correctAnswers,
                totalQuestions: questions.length,
                timeUsed
            }
        });
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user exam results
router.get('/results', auth, async (req, res) => {
    try {
        const { subject, limit = 20 } = req.query;

        const query = { user: req.user.userId };
        if (subject) query.subject = subject;

        const results = await ExamResult.find(query)
            .populate('subject', 'name code')
            .sort({ completedAt: -1 })
            .limit(parseInt(limit));

        res.json({ results });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get detailed result by ID
router.get('/results/:id', auth, async (req, res) => {
    try {
        const result = await ExamResult.findById(req.params.id)
            .populate('subject', 'name code')
            .populate('questions.question', 'questionText options explanation topic');

        if (!result || result.user.toString() !== req.user.userId) {
            return res.status(404).json({ message: 'Result not found' });
        }

        res.json({ result });
    } catch (error) {
        console.error('Get result detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get performance analytics
router.get('/analytics', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get overall stats
        const totalExams = await ExamResult.countDocuments({ user: userId });
        
        const avgScoreResult = await ExamResult.aggregate([
            { $match: { user: userId } },
            { $group: { _id: null, avgScore: { $avg: '$score' } } }
        ]);
        
        const avgScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

        // Get recent performance (last 10 exams)
        const recentResults = await ExamResult.find({ user: userId })
            .populate('subject', 'name')
            .sort({ completedAt: -1 })
            .limit(10)
            .select('subject score completedAt');

        // Get performance by subject
        const subjectPerformance = await ExamResult.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: '$subject',
                    avgScore: { $avg: '$score' },
                    totalExams: { $sum: 1 },
                    bestScore: { $max: '$score' }
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            },
            {
                $project: {
                    subjectName: { $arrayElemAt: ['$subjectInfo.name', 0] },
                    avgScore: { $round: ['$avgScore', 1] },
                    totalExams: 1,
                    bestScore: 1
                }
            }
        ]);

        res.json({
            totalExams,
            avgScore,
            recentResults,
            subjectPerformance
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;