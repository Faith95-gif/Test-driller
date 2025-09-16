const express = require('express');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const User = require('../models/User');
const ExamResult = require('../models/ExamResult');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Create new subject
router.post('/subjects', adminAuth, async (req, res) => {
    try {
        const { name, code, description, topics } = req.body;

        const subject = new Subject({
            name,
            code: code.toUpperCase(),
            description,
            topics: topics || []
        });

        await subject.save();
        res.status(201).json({ message: 'Subject created successfully', subject });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Subject name or code already exists' });
        } else {
            console.error('Create subject error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
});

// Get all subjects (including inactive)
router.get('/subjects', adminAuth, async (req, res) => {
    try {
        const subjects = await Subject.find({}).sort({ createdAt: -1 });
        res.json({ subjects });
    } catch (error) {
        console.error('Get admin subjects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update subject
router.put('/subjects/:id', adminAuth, async (req, res) => {
    try {
        const { name, code, description, topics, isActive } = req.body;
        
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            {
                name,
                code: code.toUpperCase(),
                description,
                topics,
                isActive
            },
            { new: true }
        );

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json({ message: 'Subject updated successfully', subject });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete subject
router.delete('/subjects/:id', adminAuth, async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Also delete all questions for this subject
        await Question.deleteMany({ subject: req.params.id });

        res.json({ message: 'Subject and related questions deleted successfully' });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new question
router.post('/questions', adminAuth, async (req, res) => {
    try {
        const {
            subject,
            year,
            topic,
            questionText,
            options,
            correctAnswer,
            explanation,
            difficulty
        } = req.body;

        const question = new Question({
            subject,
            year,
            topic,
            questionText,
            options,
            correctAnswer,
            explanation,
            difficulty
        });

        await question.save();
        res.status(201).json({ message: 'Question created successfully', question });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get questions with pagination
router.get('/questions', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, subject, year } = req.query;
        
        const query = {};
        if (subject) query.subject = subject;
        if (year) query.year = parseInt(year);

        const questions = await Question.find(query)
            .populate('subject', 'name code')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Question.countDocuments(query);

        res.json({
            questions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get admin questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update question
router.put('/questions/:id', adminAuth, async (req, res) => {
    try {
        const {
            subject,
            year,
            topic,
            questionText,
            options,
            correctAnswer,
            explanation,
            difficulty,
            isActive
        } = req.body;

        const question = await Question.findByIdAndUpdate(
            req.params.id,
            {
                subject,
                year,
                topic,
                questionText,
                options,
                correctAnswer,
                explanation,
                difficulty,
                isActive
            },
            { new: true }
        ).populate('subject', 'name code');

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json({ message: 'Question updated successfully', question });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete question
router.delete('/questions/:id', adminAuth, async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const users = await User.find({ role: 'student' })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments({ role: 'student' });

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get admin users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user status
router.put('/users/:id', adminAuth, async (req, res) => {
    try {
        const { isActive, subscriptionStatus } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive, subscriptionStatus },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'student' });
        const activeUsers = await User.countDocuments({ role: 'student', isActive: true });
        const premiumUsers = await User.countDocuments({ role: 'student', subscriptionStatus: 'premium' });
        const totalSubjects = await Subject.countDocuments({ isActive: true });
        const totalQuestions = await Question.countDocuments({ isActive: true });
        const totalExams = await ExamResult.countDocuments({});

        // Recent activity
        const recentUsers = await User.find({ role: 'student' })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentExams = await ExamResult.find({})
            .populate('user', 'fullName email')
            .populate('subject', 'name')
            .sort({ completedAt: -1 })
            .limit(10);

        res.json({
            totalUsers,
            activeUsers,
            premiumUsers,
            totalSubjects,
            totalQuestions,
            totalExams,
            recentUsers,
            recentExams
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reports data
router.get('/reports', adminAuth, async (req, res) => {
    try {
        // User registration trends (last 12 months)
        const userTrends = await User.aggregate([
            {
                $match: {
                    role: 'student',
                    createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Exam performance analytics
        const examPerformance = await ExamResult.aggregate([
            {
                $group: {
                    _id: '$subject',
                    avgScore: { $avg: '$score' },
                    totalExams: { $sum: 1 },
                    passRate: {
                        $avg: {
                            $cond: [{ $gte: ['$score', 50] }, 1, 0]
                        }
                    }
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
                    passRate: { $round: [{ $multiply: ['$passRate', 100] }, 1] }
                }
        // Subject popularity
        const subjectPopularity = await ExamResult.aggregate([
            {
                $group: {
                    _id: '$subject',
                    examCount: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$user' }
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
                    examCount: 1,
                    uniqueUsers: { $size: '$uniqueUsers' }
                }
            },
            { $sort: { examCount: -1 } }
        ]);
            }
        res.json({
            userTrends,
            examPerformance,
            subjectPopularity
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
        ]);
module.exports = router;