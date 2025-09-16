const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Subject = require('../models/Subject');
const Question = require('../models/Question');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jamb_cbt', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Sample data
const sampleSubjects = [
    {
        name: 'Mathematics',
        code: 'MTH',
        description: 'Mathematics questions covering algebra, geometry, calculus, and statistics',
        topics: [
            { name: 'Algebra', description: 'Linear and quadratic equations' },
            { name: 'Geometry', description: 'Shapes, angles, and measurements' },
            { name: 'Calculus', description: 'Differentiation and integration' },
            { name: 'Statistics', description: 'Data analysis and probability' }
        ]
    },
    {
        name: 'English Language',
        code: 'ENG',
        description: 'English language questions covering grammar, comprehension, and vocabulary',
        topics: [
            { name: 'Grammar', description: 'Parts of speech and sentence structure' },
            { name: 'Comprehension', description: 'Reading and understanding passages' },
            { name: 'Vocabulary', description: 'Word meanings and usage' },
            { name: 'Literature', description: 'Literary devices and analysis' }
        ]
    },
    {
        name: 'Chemistry',
        code: 'CHM',
        description: 'Chemistry questions covering organic, inorganic, and physical chemistry',
        topics: [
            { name: 'Organic Chemistry', description: 'Carbon compounds and reactions' },
            { name: 'Inorganic Chemistry', description: 'Elements and their compounds' },
            { name: 'Physical Chemistry', description: 'Chemical bonding and thermodynamics' },
            { name: 'Analytical Chemistry', description: 'Chemical analysis techniques' }
        ]
    }
];

const sampleQuestions = [
    // Mathematics Questions
    {
        questionText: 'Solve for x: 2x + 5 = 13',
        options: [
            { label: 'A', text: 'x = 3' },
            { label: 'B', text: 'x = 4' },
            { label: 'C', text: 'x = 5' },
            { label: 'D', text: 'x = 6' }
        ],
        correctAnswer: 'B',
        explanation: '2x + 5 = 13, so 2x = 8, therefore x = 4',
        topic: 'Algebra',
        year: 2023,
        difficulty: 'easy'
    },
    {
        questionText: 'What is the area of a circle with radius 7cm? (Use π = 22/7)',
        options: [
            { label: 'A', text: '154 cm²' },
            { label: 'B', text: '144 cm²' },
            { label: 'C', text: '164 cm²' },
            { label: 'D', text: '174 cm²' }
        ],
        correctAnswer: 'A',
        explanation: 'Area = πr² = (22/7) × 7² = (22/7) × 49 = 154 cm²',
        topic: 'Geometry',
        year: 2023,
        difficulty: 'medium'
    },
    {
        questionText: 'If log₁₀ 2 = 0.3010, find log₁₀ 8',
        options: [
            { label: 'A', text: '0.9030' },
            { label: 'B', text: '0.8030' },
            { label: 'C', text: '0.7030' },
            { label: 'D', text: '1.0030' }
        ],
        correctAnswer: 'A',
        explanation: 'log₁₀ 8 = log₁₀ 2³ = 3 log₁₀ 2 = 3 × 0.3010 = 0.9030',
        topic: 'Algebra',
        year: 2022,
        difficulty: 'hard'
    },
    
    // English Questions
    {
        questionText: 'Choose the correct option: The boy _____ to school every day.',
        options: [
            { label: 'A', text: 'go' },
            { label: 'B', text: 'goes' },
            { label: 'C', text: 'going' },
            { label: 'D', text: 'gone' }
        ],
        correctAnswer: 'B',
        explanation: 'The subject "boy" is singular, so we use "goes" (third person singular present)',
        topic: 'Grammar',
        year: 2023,
        difficulty: 'easy'
    },
    {
        questionText: 'What does the word "ubiquitous" mean?',
        options: [
            { label: 'A', text: 'Very rare' },
            { label: 'B', text: 'Present everywhere' },
            { label: 'C', text: 'Ancient' },
            { label: 'D', text: 'Mysterious' }
        ],
        correctAnswer: 'B',
        explanation: 'Ubiquitous means present, appearing, or found everywhere',
        topic: 'Vocabulary',
        year: 2023,
        difficulty: 'medium'
    },
    
    // Chemistry Questions
    {
        questionText: 'What is the chemical formula for water?',
        options: [
            { label: 'A', text: 'H₂O' },
            { label: 'B', text: 'H₃O' },
            { label: 'C', text: 'HO₂' },
            { label: 'D', text: 'H₂O₂' }
        ],
        correctAnswer: 'A',
        explanation: 'Water consists of two hydrogen atoms bonded to one oxygen atom: H₂O',
        topic: 'Inorganic Chemistry',
        year: 2023,
        difficulty: 'easy'
    },
    {
        questionText: 'Which of the following is an alkane?',
        options: [
            { label: 'A', text: 'C₂H₄' },
            { label: 'B', text: 'C₂H₂' },
            { label: 'C', text: 'C₂H₆' },
            { label: 'D', text: 'C₂H₅OH' }
        ],
        correctAnswer: 'C',
        explanation: 'C₂H₆ (ethane) is an alkane with the general formula CₙH₂ₙ₊₂',
        topic: 'Organic Chemistry',
        year: 2022,
        difficulty: 'medium'
    }
];

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Question.deleteMany({});

        console.log('Cleared existing data');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 12);
        const adminUser = new User({
            fullName: 'Admin User',
            email: 'admin@jambcbt.com',
            password: 'admin123', // Will be hashed by pre-save middleware
            role: 'admin',
            subscriptionStatus: 'premium'
        });
        await adminUser.save();

        // Create sample student
        const studentUser = new User({
            fullName: 'John Doe',
            email: 'student@example.com',
            password: 'student123', // Will be hashed by pre-save middleware
            role: 'student',
            subscriptionStatus: 'free'
        });
        await studentUser.save();

        console.log('Created admin and student users');

        // Create subjects
        const createdSubjects = [];
        for (const subjectData of sampleSubjects) {
            const subject = new Subject(subjectData);
            await subject.save();
            createdSubjects.push(subject);
        }

        console.log('Created subjects');

        // Create questions
        for (const questionData of sampleQuestions) {
            let subjectName;
            
            if (questionData.topic === 'Algebra' || questionData.topic === 'Geometry') {
                subjectName = 'Mathematics';
            } else if (questionData.topic === 'Grammar' || questionData.topic === 'Vocabulary') {
                subjectName = 'English Language';
            } else {
                subjectName = 'Chemistry';
            }
            
            const subject = createdSubjects.find(s => s.name === subjectName);
            
            if (subject) {
                const question = new Question({
                    ...questionData,
                    subject: subject._id
                });
                await question.save();
            }
        }

        console.log('Created sample questions');

        // Add more questions for each subject and year
        await createAdditionalQuestions(createdSubjects);

        console.log('Database seeding completed successfully!');
        console.log('\nLogin credentials:');
        console.log('Admin: admin@jambcbt.com / admin123');
        console.log('Student: student@example.com / student123');
        console.log('\nActivation Key for Premium: JAMB2024PREMIUM');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
}

async function createAdditionalQuestions(subjects) {
    // Generate more questions for each subject to have sufficient questions for exams
    const mathSubject = subjects.find(s => s.name === 'Mathematics');
    const englishSubject = subjects.find(s => s.name === 'English Language');
    const chemistrySubject = subjects.find(s => s.name === 'Chemistry');

    const additionalQuestions = [
        // More Math Questions
        {
            subject: mathSubject._id,
            questionText: 'Find the value of x if 3x - 7 = 14',
            options: [
                { label: 'A', text: '7' },
                { label: 'B', text: '6' },
                { label: 'C', text: '5' },
                { label: 'D', text: '8' }
            ],
            correctAnswer: 'A',
            explanation: '3x - 7 = 14, so 3x = 21, therefore x = 7',
            topic: 'Algebra',
            year: 2023,
            difficulty: 'easy'
        },
        {
            subject: mathSubject._id,
            questionText: 'What is the perimeter of a rectangle with length 8cm and width 5cm?',
            options: [
                { label: 'A', text: '26cm' },
                { label: 'B', text: '24cm' },
                { label: 'C', text: '28cm' },
                { label: 'D', text: '30cm' }
            ],
            correctAnswer: 'A',
            explanation: 'Perimeter = 2(l + w) = 2(8 + 5) = 2(13) = 26cm',
            topic: 'Geometry',
            year: 2023,
            difficulty: 'easy'
        },
        
        // More English Questions
        {
            subject: englishSubject._id,
            questionText: 'Choose the word that is opposite in meaning to "generous"',
            options: [
                { label: 'A', text: 'Kind' },
                { label: 'B', text: 'Selfish' },
                { label: 'C', text: 'Helpful' },
                { label: 'D', text: 'Caring' }
            ],
            correctAnswer: 'B',
            explanation: 'Generous means giving freely, so selfish (keeping things to oneself) is the opposite',
            topic: 'Vocabulary',
            year: 2023,
            difficulty: 'easy'
        },
        
        // More Chemistry Questions
        {
            subject: chemistrySubject._id,
            questionText: 'What is the atomic number of carbon?',
            options: [
                { label: 'A', text: '4' },
                { label: 'B', text: '6' },
                { label: 'C', text: '8' },
                { label: 'D', text: '12' }
            ],
            correctAnswer: 'B',
            explanation: 'Carbon has 6 protons, so its atomic number is 6',
            topic: 'Inorganic Chemistry',
            year: 2023,
            difficulty: 'easy'
        }
    ];

    // Create additional questions
    for (const questionData of additionalQuestions) {
        const question = new Question(questionData);
        await question.save();
    }

    // Generate more questions programmatically to reach 40+ questions per subject
    await generateMoreQuestions(mathSubject, englishSubject, chemistrySubject);
}

async function generateMoreQuestions(mathSubject, englishSubject, chemistrySubject) {
    const years = [2020, 2021, 2022, 2023];
    
    // Generate more math questions
    for (let i = 0; i < 35; i++) {
        const question = new Question({
            subject: mathSubject._id,
            questionText: `Mathematics practice question ${i + 1}: Solve the equation or find the value.`,
            options: [
                { label: 'A', text: `Option A - Answer ${i + 1}` },
                { label: 'B', text: `Option B - Answer ${i + 2}` },
                { label: 'C', text: `Option C - Answer ${i + 3}` },
                { label: 'D', text: `Option D - Answer ${i + 4}` }
            ],
            correctAnswer: ['A', 'B', 'C', 'D'][i % 4],
            explanation: `This is the explanation for mathematics question ${i + 1}`,
            topic: ['Algebra', 'Geometry', 'Statistics', 'Calculus'][i % 4],
            year: years[i % years.length],
            difficulty: ['easy', 'medium', 'hard'][i % 3]
        });
        await question.save();
    }

    // Generate more English questions
    for (let i = 0; i < 35; i++) {
        const question = new Question({
            subject: englishSubject._id,
            questionText: `English practice question ${i + 1}: Choose the correct option or meaning.`,
            options: [
                { label: 'A', text: `Option A - Answer ${i + 1}` },
                { label: 'B', text: `Option B - Answer ${i + 2}` },
                { label: 'C', text: `Option C - Answer ${i + 3}` },
                { label: 'D', text: `Option D - Answer ${i + 4}` }
            ],
            correctAnswer: ['A', 'B', 'C', 'D'][i % 4],
            explanation: `This is the explanation for English question ${i + 1}`,
            topic: ['Grammar', 'Vocabulary', 'Comprehension', 'Literature'][i % 4],
            year: years[i % years.length],
            difficulty: ['easy', 'medium', 'hard'][i % 3]
        });
        await question.save();
    }

    // Generate more Chemistry questions
    for (let i = 0; i < 35; i++) {
        const question = new Question({
            subject: chemistrySubject._id,
            questionText: `Chemistry practice question ${i + 1}: Identify the compound or reaction.`,
            options: [
                { label: 'A', text: `Option A - Answer ${i + 1}` },
                { label: 'B', text: `Option B - Answer ${i + 2}` },
                { label: 'C', text: `Option C - Answer ${i + 3}` },
                { label: 'D', text: `Option D - Answer ${i + 4}` }
            ],
            correctAnswer: ['A', 'B', 'C', 'D'][i % 4],
            explanation: `This is the explanation for Chemistry question ${i + 1}`,
            topic: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'][i % 4],
            year: years[i % years.length],
            difficulty: ['easy', 'medium', 'hard'][i % 3]
        });
        await question.save();
    }
}

// Run the seeding
seedDatabase();