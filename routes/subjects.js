const express = require('express');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all active subjects
router.get('/', async (req, res) => {
    try {
        const subjects = await Subject.find({ isActive: true }).select('name code description topics');
        res.json({ subjects });
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single subject by ID
router.get('/:id', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject || !subject.isActive) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json({ subject });
    } catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;