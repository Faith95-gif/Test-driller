// Exam JavaScript

let examData = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let flaggedQuestions = new Set();
let examTimer = null;
let timeRemaining = 7200; // 2 hours in seconds
let questionStartTime = Date.now();

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load exam data
    loadExamData();
    
    // Initialize exam
    initializeExam();
    
    // Set up event listeners
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        window.location.href = '/login';
        return;
    }
}

function loadExamData() {
    examData = JSON.parse(localStorage.getItem('examData'));
    
    if (!examData) {
        alert('No exam data found. Redirecting to dashboard...');
        window.location.href = '/dashboard';
        return;
    }
    
    // Update exam header
    document.getElementById('examSubject').textContent = 'Loading...';
    document.getElementById('examYear').textContent = examData.year;
    document.getElementById('questionCount').textContent = `${examData.questionCount || 40} Questions`;
    
    // Set timer based on exam type
    if (examData.type === 'practice') {
        timeRemaining = 3600; // 1 hour for practice
        document.querySelector('.timer-label').textContent = 'Practice Timer';
    }
}

async function initializeExam() {
    try {
        // Show loading
        document.getElementById('loadingIndicator').style.display = 'flex';
        
        // Load questions
        const token = localStorage.getItem('token');
        const endpoint = examData.type === 'practice' 
            ? `/api/questions/practice/${examData.subjectId}/${examData.year}`
            : `/api/questions/${examData.subjectId}/${examData.year}`;
        
        const params = new URLSearchParams();
        params.append('limit', examData.questionCount || 40);
        if (examData.topic) {
            params.append('topic', examData.topic);
        }
        
        const response = await fetch(`${endpoint}?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            questions = data.questions;
            
            if (questions.length === 0) {
                alert('No questions found for the selected criteria.');
                window.location.href = '/dashboard';
                return;
            }
            
            // Update exam info
            document.getElementById('examSubject').textContent = questions[0].subject.name;
            document.getElementById('totalQuestions').textContent = questions.length;
            
            // Initialize answers object
            questions.forEach((_, index) => {
                answers[index] = null;
            });
            
            // Generate question navigation
            generateQuestionNavigation();
            
            // Load first question
            loadQuestion(0);
            
            // Start timer
            startTimer();
            
            // Hide loading
            document.getElementById('loadingIndicator').style.display = 'none';
            
        } else {
            throw new Error('Failed to load questions');
        }
    } catch (error) {
        console.error('Error initializing exam:', error);
        alert('Error loading exam. Please try again.');
        window.location.href = '/dashboard';
    }
}

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            saveCurrentAnswer();
            loadQuestion(currentQuestionIndex - 1);
        }
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            saveCurrentAnswer();
            loadQuestion(currentQuestionIndex + 1);
        }
    });
    
    // Flag button
    document.getElementById('flagBtn').addEventListener('click', toggleFlag);
    
    // Submit button
    document.getElementById('submitExamBtn').addEventListener('click', showSubmitModal);
    
    // Modal buttons
    document.getElementById('confirmSubmit').addEventListener('click', submitExam);
    document.getElementById('cancelSubmit').addEventListener('click', hideSubmitModal);
    
    // Prevent accidental page refresh
    window.addEventListener('beforeunload', function(e) {
        if (examTimer) {
            e.preventDefault();
            e.returnValue = 'Are you sure you want to leave? Your exam progress will be lost.';
            return e.returnValue;
        }
    });
}

function generateQuestionNavigation() {
    const navGrid = document.getElementById('questionNavGrid');
    navGrid.innerHTML = '';
    
    for (let i = 0; i < questions.length; i++) {
        const navBtn = document.createElement('button');
        navBtn.className = 'nav-btn';
        navBtn.textContent = i + 1;
        navBtn.addEventListener('click', () => {
            saveCurrentAnswer();
            loadQuestion(i);
        });
        navGrid.appendChild(navBtn);
    }
}

function loadQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    questionStartTime = Date.now();
    const question = questions[index];
    
    // Update question content
    document.getElementById('currentQuestionNumber').textContent = index + 1;
    document.getElementById('questionText').textContent = question.questionText;
    
    // Load options
    const optionsContainer = document.getElementById('questionOptions');
    optionsContainer.innerHTML = '';
    
    question.options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        
        const optionInput = document.createElement('input');
        optionInput.type = 'radio';
        optionInput.name = 'answer';
        optionInput.value = option.label;
        optionInput.id = `option_${option.label}`;
        
        // Set checked state if answer exists
        if (answers[index] === option.label) {
            optionInput.checked = true;
            optionDiv.classList.add('selected');
        }
        
        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = `option_${option.label}`;
        optionLabel.innerHTML = `
            <span class="option-label">${option.label}</span>
            <span class="option-text">${option.text}</span>
        `;
        
        optionDiv.appendChild(optionInput);
        optionDiv.appendChild(optionLabel);
        
        // Add click handler for visual feedback
        optionDiv.addEventListener('click', function() {
            document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            optionInput.checked = true;
        });
        
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === questions.length - 1;
    
    // Show submit button on last question
    const submitBtn = document.getElementById('submitExamBtn');
    if (index === questions.length - 1) {
        submitBtn.style.display = 'block';
    } else {
        submitBtn.style.display = 'none';
    }
    
    // Update flag button
    const flagBtn = document.getElementById('flagBtn');
    if (flaggedQuestions.has(index)) {
        flagBtn.classList.add('flagged');
        flagBtn.innerHTML = '<span class="flag-icon">🏳️</span> Unflag Question';
    } else {
        flagBtn.classList.remove('flagged');
        flagBtn.innerHTML = '<span class="flag-icon">🏳️</span> Flag Question';
    }
    
    // Update question navigation
    updateQuestionNavigation();
    
    // Show explanation for practice mode
    if (examData.type === 'practice' && question.explanation) {
        showExplanation(question.explanation);
    }
}

function saveCurrentAnswer() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');
    if (selectedAnswer) {
        answers[currentQuestionIndex] = selectedAnswer.value;
        
        // Record time spent on question
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        if (!answers.timeSpent) {
            answers.timeSpent = {};
        }
        answers.timeSpent[currentQuestionIndex] = timeSpent;
    }
    
    updateQuestionNavigation();
}

function updateQuestionNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach((btn, index) => {
        btn.className = 'nav-btn';
        
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        } else if (answers[index] !== null) {
            btn.classList.add('answered');
        }
        
        if (flaggedQuestions.has(index)) {
            btn.classList.add('flagged');
        }
    });
}

function toggleFlag() {
    if (flaggedQuestions.has(currentQuestionIndex)) {
        flaggedQuestions.delete(currentQuestionIndex);
    } else {
        flaggedQuestions.add(currentQuestionIndex);
    }
    
    // Update flag button
    const flagBtn = document.getElementById('flagBtn');
    if (flaggedQuestions.has(currentQuestionIndex)) {
        flagBtn.classList.add('flagged');
        flagBtn.innerHTML = '<span class="flag-icon">🏳️</span> Unflag Question';
    } else {
        flagBtn.classList.remove('flagged');
        flagBtn.innerHTML = '<span class="flag-icon">🏳️</span> Flag Question';
    }
    
    updateQuestionNavigation();
}

function startTimer() {
    updateTimerDisplay();
    
    examTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            alert('Time is up! Submitting exam...');
            submitExam();
        } else if (timeRemaining <= 300) { // 5 minutes warning
            document.querySelector('.timer-display').style.color = '#EF4444';
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = timeString;
}

function showSubmitModal() {
    saveCurrentAnswer();
    
    // Calculate submission stats
    const answeredCount = Object.values(answers).filter(answer => answer !== null).length;
    const unansweredCount = questions.length - answeredCount;
    const flaggedCount = flaggedQuestions.size;
    
    // Update modal content
    document.getElementById('answeredCount').textContent = answeredCount;
    document.getElementById('unansweredCount').textContent = unansweredCount;
    document.getElementById('flaggedCount').textContent = flaggedCount;
    
    // Show modal
    document.getElementById('submitModal').style.display = 'flex';
}

function hideSubmitModal() {
    document.getElementById('submitModal').style.display = 'none';
}

async function submitExam() {
    try {
        // Stop timer
        if (examTimer) {
            clearInterval(examTimer);
            examTimer = null;
        }
        
        // Prepare submission data
        const timeUsed = (examData.type === 'practice' ? 3600 : 7200) - timeRemaining;
        const submissionAnswers = [];
        
        Object.entries(answers).forEach(([index, selectedAnswer]) => {
            if (selectedAnswer !== null) {
                submissionAnswers.push({
                    questionId: questions[index]._id,
                    selectedAnswer: selectedAnswer,
                    timeSpent: answers.timeSpent?.[index] || 0
                });
            }
        });
        
        const submissionData = {
            subject: examData.subjectId,
            examType: examData.type,
            year: parseInt(examData.year),
            answers: submissionAnswers,
            timeUsed: timeUsed
        };
        
        // Submit to server
        const token = localStorage.getItem('token');
        const response = await fetch('/api/exams/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(submissionData)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Store result ID and redirect to results page
            localStorage.setItem('resultId', result.result.id);
            localStorage.removeItem('examData'); // Clean up
            
            window.location.href = '/results';
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Error submitting exam:', error);
        alert('Error submitting exam. Please try again.');
    }
}

function showExplanation(explanation) {
    // For practice mode, show explanation after answering
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'explanation';
    explanationDiv.innerHTML = `
        <h4>Explanation:</h4>
        <p>${explanation}</p>
    `;
    
    const questionContainer = document.querySelector('.question-content');
    const existingExplanation = questionContainer.querySelector('.explanation');
    
    if (existingExplanation) {
        existingExplanation.remove();
    }
    
    questionContainer.appendChild(explanationDiv);
}

console.log('Exam JS loaded successfully');