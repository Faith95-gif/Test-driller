const express = require('express');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');

const router = express.Router();

// Get questions by multiple subjects and year
router.get('/multiple/:year', auth, async (req, res) => {
    try {
        const { year } = req.params;
        const { subjects, limit = 40, topic } = req.query;
        
        if (!subjects) {
            return res.status(400).json({ message: 'Subjects parameter is required' });
        }
        
        const subjectIds = subjects.split(',');
        
        // Build query
        const query = {
            subject: { $in: subjectIds },
            year: parseInt(year),
            isActive: true
        };

        if (topic) {
            query.topic = topic;
        }

        const questions = await Question.find(query)
            .limit(parseInt(limit))
            .populate('subject', 'name code')
            .select('-correctAnswer -explanation'); // Hide answers for exam mode

        res.json({ questions });
    } catch (error) {
        console.error('Get multiple questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get questions by subject and year (single subject - backward compatibility)
router.get('/:subjectId/:year', auth, async (req, res) => {
    try {
        const { subjectId, year } = req.params;
        const { limit = 40, topic } = req.query;

        // Build query
        const query = {
            subject: subjectId,
            year: parseInt(year),
            isActive: true
        };

        if (topic) {
            query.topic = topic;
        }

        const questions = await Question.find(query)
            .limit(parseInt(limit))
            .populate('subject', 'name code')
            .select('-correctAnswer -explanation'); // Hide answers for exam mode

        res.json({ questions });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get practice questions for multiple subjects (with answers and explanations)
router.get('/practice/multiple/:year', auth, async (req, res) => {
    try {
        const { year } = req.params;
        const { subjects, limit = 20, topic } = req.query;
        
        if (!subjects) {
            return res.status(400).json({ message: 'Subjects parameter is required' });
        }
        
        const subjectIds = subjects.split(',');

        const query = {
            subject: { $in: subjectIds },
            year: parseInt(year),
            isActive: true
        };

        if (topic) {
            query.topic = topic;
        }

        const questions = await Question.find(query)
            .limit(parseInt(limit))
            .populate('subject', 'name code');

        res.json({ questions });
    } catch (error) {
        console.error('Get multiple practice questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get practice questions (with answers and explanations) - single subject
router.get('/practice/:subjectId/:year', auth, async (req, res) => {
    try {
        const { subjectId, year } = req.params;
        const { limit = 20, topic } = req.query;

        const query = {
            subject: subjectId,
            year: parseInt(year),
            isActive: true
        };

        if (topic) {
            query.topic = topic;
        }

        const questions = await Question.find(query)
            .limit(parseInt(limit))
            .populate('subject', 'name code');

        res.json({ questions });
    } catch (error) {
        console.error('Get practice questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available years for a subject
router.get('/:subjectId/years', async (req, res) => {
    try {
        const years = await Question.distinct('year', {
            subject: req.params.subjectId,
            isActive: true
        });
        res.json({ years: years.sort((a, b) => b - a) });
    } catch (error) {
        console.error('Get years error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get topics for a subject and year
router.get('/:subjectId/:year/topics', async (req, res) => {
    try {
        const topics = await Question.distinct('topic', {
            subject: req.params.subjectId,
            year: parseInt(req.params.year),
            isActive: true
        });
        res.json({ topics });
    } catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;