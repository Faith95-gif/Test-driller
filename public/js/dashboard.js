// Dashboard JavaScript

let currentUser = null;
let subjects = [];
let currentTab = 'overview';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        window.location.href = '/login.html';
        return;
    }
    
    // Redirect admin users
    if (user.role === 'admin') {
        window.location.href = '/admin.html';
        return;
    }
    
    currentUser = user;
    
    // Update welcome message
    const welcomeElement = document.getElementById('userWelcome');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${user.fullName}!`;
    }
    
    // Update subscription badge
    const subscriptionBadge = document.getElementById('subscriptionBadge');
    if (subscriptionBadge) {
        subscriptionBadge.textContent = user.subscriptionStatus === 'premium' ? 'Premium Account' : 'Free Account';
        subscriptionBadge.className = `subscription-badge ${user.subscriptionStatus}`;
    }
}

function initializeDashboard() {
    // Set up tab navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Initialize profile fields
    if (currentUser) {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileType = document.getElementById('profileType');
        
        if (profileName) profileName.value = currentUser.fullName;
        if (profileEmail) profileEmail.value = currentUser.email;
        if (profileType) profileType.value = currentUser.subscriptionStatus === 'premium' ? 'Premium' : 'Free';
    }
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        });
    }
    
    // Practice mode setup
    const practiceSubject = document.getElementById('practiceSubject');
    const practiceYear = document.getElementById('practiceYear');
    const practiceTopic = document.getElementById('practiceTopic');
    const startPracticeBtn = document.getElementById('startPracticeBtn');
    
    if (practiceSubject) {
        practiceSubject.addEventListener('change', function() {
            loadYears(this.value, 'practiceYear');
            loadTopics(this.value, practiceYear.value, 'practiceTopic');
        });
    }
    
    if (practiceYear) {
        practiceYear.addEventListener('change', function() {
            loadTopics(practiceSubject.value, this.value, 'practiceTopic');
        });
    }
    
    if (startPracticeBtn) {
        startPracticeBtn.addEventListener('click', startPractice);
    }
    
    // Exam mode setup
    const examSubject = document.getElementById('examSubject');
    const examYear = document.getElementById('examYear');
    const startExamBtn = document.getElementById('startExamBtn');
    
    if (examSubject) {
        examSubject.addEventListener('change', function() {
            loadYears(this.value, 'examYear');
        });
    }
    
    if (startExamBtn) {
        startExamBtn.addEventListener('click', startExam);
    }
    
    // Activation button
    const activateBtn = document.getElementById('activateBtn');
    if (activateBtn) {
        activateBtn.addEventListener('click', activateAccount);
    }

    // Setup multi-select functionality
    setupMultiSelect();
    setupTimeSelector();
}

function setupMultiSelect() {
    // Convert single selects to multi-select for subjects
    const practiceSubjectContainer = document.querySelector('#practice .form-group:first-child');
    const examSubjectContainer = document.querySelector('#exam .form-group:first-child');
    
    if (practiceSubjectContainer) {
        practiceSubjectContainer.innerHTML = `
            <label>Select Subjects:</label>
            <div id="practiceSubjects" class="multi-select-container">
                <!-- Will be populated with checkboxes -->
            </div>
        `;
    }
    
    if (examSubjectContainer) {
        examSubjectContainer.innerHTML = `
            <label>Select Subjects:</label>
            <div id="examSubjects" class="multi-select-container">
                <!-- Will be populated with checkboxes -->
            </div>
        `;
    }
}

function setupTimeSelector() {
    // Add time selectors for practice and exam
    const practiceSetup = document.querySelector('.practice-setup');
    const examSetup = document.querySelector('.exam-setup');
    
    if (practiceSetup) {
        const timeGroup = document.createElement('div');
        timeGroup.className = 'form-group';
        timeGroup.innerHTML = `
            <label>Time Limit (minutes):</label>
            <select id="practiceTime">
                <option value="30">30 minutes</option>
                <option value="60" selected>60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
                <option value="0">No time limit</option>
            </select>
        `;
        practiceSetup.insertBefore(timeGroup, practiceSetup.lastElementChild);
    }
    
    if (examSetup) {
        const timeGroup = document.createElement('div');
        timeGroup.className = 'form-group';
        timeGroup.innerHTML = `
            <label>Time Limit (minutes):</label>
            <select id="examTime">
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120" selected>120 minutes</option>
                <option value="150">150 minutes</option>
                <option value="180">180 minutes</option>
            </select>
        `;
        examSetup.insertBefore(timeGroup, examSetup.lastElementChild);
    }
}

function switchTab(tabName) {
    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Load tab-specific data
    switch (tabName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'subjects':
            loadSubjects();
            break;
        case 'practice':
            loadSubjects();
            break;
        case 'exam':
            loadSubjects();
            break;
        case 'results':
            loadResults();
            break;
    }
}

async function loadDashboardData() {
    try {
        // Load subjects for dropdowns
        await loadSubjects();
        await loadOverviewData();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadOverviewData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/exams/analytics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update stats
            document.getElementById('totalExams').textContent = data.totalExams || 0;
            document.getElementById('avgScore').textContent = `${data.avgScore || 0}%`;
            document.getElementById('totalSubjects').textContent = subjects.length;
            
            // Find best score
            let bestScore = 0;
            if (data.subjectPerformance && data.subjectPerformance.length > 0) {
                bestScore = Math.max(...data.subjectPerformance.map(s => s.bestScore || 0));
            }
            document.getElementById('bestScore').textContent = `${bestScore}%`;
            
            // Load recent results
            loadRecentActivity(data.recentResults);
        } else {
            // Set default values if request fails
            document.getElementById('totalExams').textContent = '0';
            document.getElementById('avgScore').textContent = '0%';
            document.getElementById('totalSubjects').textContent = subjects.length;
            document.getElementById('bestScore').textContent = '0%';
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

function loadRecentActivity(recentResults) {
    const recentResultsContainer = document.getElementById('recentResults');
    
    if (!recentResults || recentResults.length === 0) {
        recentResultsContainer.innerHTML = '<p>No recent activity</p>';
        return;
    }
    
    recentResultsContainer.innerHTML = recentResults.slice(0, 5).map(result => `
        <div class="activity-item">
            <div class="activity-info">
                <h4>${result.subject.name} ${result.examType}</h4>
                <p>Score: ${result.score}% | ${new Date(result.completedAt).toLocaleDateString()}</p>
            </div>
        </div>
    `).join('');
}

async function loadSubjects() {
    try {
        const response = await fetch('/api/subjects');
        
        if (response.ok) {
            const data = await response.json();
            subjects = data.subjects || [];
            
            // Update subjects page
            displaySubjects();
            
            // Update dropdown menus and multi-select
            updateSubjectSelectors();
        } else {
            console.error('Failed to load subjects');
            subjects = [];
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        subjects = [];
    }
}

function displaySubjects() {
    const subjectsList = document.getElementById('subjectsList');
    if (!subjectsList) return;
    
    if (subjects.length === 0) {
        subjectsList.innerHTML = '<p>No subjects available. Contact admin to add subjects.</p>';
        return;
    }
    
    subjectsList.innerHTML = subjects.map(subject => `
        <div class="subject-card">
            <div class="subject-icon">📚</div>
            <h3>${subject.name}</h3>
            <p>${subject.description || 'Practice questions and take exams'}</p>
            <div class="subject-actions">
                <button class="btn btn-primary" onclick="selectSubjectForPractice('${subject._id}', '${subject.name}')">Practice</button>
                <button class="btn btn-secondary" onclick="selectSubjectForExam('${subject._id}', '${subject.name}')">Take Exam</button>
            </div>
        </div>
    `).join('');
}

function updateSubjectSelectors() {
    // Update multi-select containers
    const practiceSubjects = document.getElementById('practiceSubjects');
    const examSubjects = document.getElementById('examSubjects');
    
    if (practiceSubjects) {
        practiceSubjects.innerHTML = subjects.map(subject => `
            <div class="subject-checkbox">
                <input type="checkbox" id="practice_${subject._id}" value="${subject._id}" class="practice-subject-checkbox">
                <label for="practice_${subject._id}">${subject.name}</label>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.practice-subject-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updatePracticeYears);
        });
    }
    
    if (examSubjects) {
        examSubjects.innerHTML = subjects.map(subject => `
            <div class="subject-checkbox">
                <input type="checkbox" id="exam_${subject._id}" value="${subject._id}" class="exam-subject-checkbox">
                <label for="exam_${subject._id}">${subject.name}</label>
            </div>
        `).join('');
        
        // Add event listeners
        document.querySelectorAll('.exam-subject-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateExamYears);
        });
    }
}

function updatePracticeYears() {
    const selectedSubjects = Array.from(document.querySelectorAll('.practice-subject-checkbox:checked')).map(cb => cb.value);
    if (selectedSubjects.length > 0) {
        loadYearsForMultipleSubjects(selectedSubjects, 'practiceYear');
    }
}

function updateExamYears() {
    const selectedSubjects = Array.from(document.querySelectorAll('.exam-subject-checkbox:checked')).map(cb => cb.value);
    if (selectedSubjects.length > 0) {
        loadYearsForMultipleSubjects(selectedSubjects, 'examYear');
    }
}

async function loadYearsForMultipleSubjects(subjectIds, yearDropdownId) {
    try {
        const allYears = new Set();
        
        for (const subjectId of subjectIds) {
            const response = await fetch(`/api/questions/${subjectId}/years`);
            if (response.ok) {
                const data = await response.json();
                data.years.forEach(year => allYears.add(year));
            }
        }
        
        const yearDropdown = document.getElementById(yearDropdownId);
        if (yearDropdown) {
            const sortedYears = Array.from(allYears).sort((a, b) => b - a);
            yearDropdown.innerHTML = '<option value="">Choose a year...</option>' + 
                sortedYears.map(year => `<option value="${year}">${year}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading years for multiple subjects:', error);
    }
}

async function loadYears(subjectId, yearDropdownId) {
    if (!subjectId) return;
    
    try {
        const response = await fetch(`/api/questions/${subjectId}/years`);
        
        if (response.ok) {
            const data = await response.json();
            const yearDropdown = document.getElementById(yearDropdownId);
            
            if (yearDropdown) {
                yearDropdown.innerHTML = '<option value="">Choose a year...</option>' + 
                    data.years.map(year => `<option value="${year}">${year}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading years:', error);
    }
}

async function loadTopics(subjectId, year, topicDropdownId) {
    if (!subjectId || !year) return;
    
    try {
        const response = await fetch(`/api/questions/${subjectId}/${year}/topics`);
        
        if (response.ok) {
            const data = await response.json();
            const topicDropdown = document.getElementById(topicDropdownId);
            
            if (topicDropdown) {
                topicDropdown.innerHTML = '<option value="">All topics</option>' + 
                    data.topics.map(topic => `<option value="${topic}">${topic}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading topics:', error);
    }
}

function selectSubjectForPractice(subjectId, subjectName) {
    // Switch to practice tab
    switchTab('practice');
    
    // Select the subject checkbox
    const checkbox = document.getElementById(`practice_${subjectId}`);
    if (checkbox) {
        checkbox.checked = true;
        updatePracticeYears();
    }
}

function selectSubjectForExam(subjectId, subjectName) {
    // Switch to exam tab
    switchTab('exam');
    
    // Select the subject checkbox
    const checkbox = document.getElementById(`exam_${subjectId}`);
    if (checkbox) {
        checkbox.checked = true;
        updateExamYears();
    }
}

async function startPractice() {
    const selectedSubjects = Array.from(document.querySelectorAll('.practice-subject-checkbox:checked')).map(cb => cb.value);
    const year = document.getElementById('practiceYear').value;
    const topic = document.getElementById('practiceTopic') ? document.getElementById('practiceTopic').value : '';
    const questionCount = document.getElementById('practiceQuestions').value;
    const timeLimit = document.getElementById('practiceTime').value;
    
    if (selectedSubjects.length === 0 || !year) {
        alert('Please select at least one subject and a year');
        return;
    }
    
    // Store practice settings
    const practiceData = {
        type: 'practice',
        subjects: selectedSubjects,
        year,
        topic,
        questionCount,
        timeLimit: parseInt(timeLimit) * 60 // Convert to seconds
    };
    
    localStorage.setItem('examData', JSON.stringify(practiceData));
    window.location.href = '/exam.html';
}

async function startExam() {
    const selectedSubjects = Array.from(document.querySelectorAll('.exam-subject-checkbox:checked')).map(cb => cb.value);
    const year = document.getElementById('examYear').value;
    const timeLimit = document.getElementById('examTime').value;
    
    if (selectedSubjects.length === 0 || !year) {
        alert('Please select at least one subject and a year');
        return;
    }
    
    // Store exam settings
    const examData = {
        type: 'exam',
        subjects: selectedSubjects,
        year,
        questionCount: 40,
        timeLimit: parseInt(timeLimit) * 60 // Convert to seconds
    };
    
    localStorage.setItem('examData', JSON.stringify(examData));
    window.location.href = '/exam.html';
}

async function loadResults() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/exams/results', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayResults(data.results);
        } else {
            console.error('Failed to load results');
            displayResults([]);
        }
    } catch (error) {
        console.error('Error loading results:', error);
        displayResults([]);
    }
}

function displayResults(results) {
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;
    
    if (!results || results.length === 0) {
        resultsList.innerHTML = '<p>No exam results yet. Take your first exam to see results here!</p>';
        return;
    }
    
    resultsList.innerHTML = results.map(result => `
        <div class="result-item">
            <div class="result-info">
                <h3>${result.subject.name} - ${result.examType}</h3>
                <p>${result.year} | ${result.totalQuestions} questions | ${new Date(result.completedAt).toLocaleDateString()}</p>
            </div>
            <div class="result-score ${getScoreClass(result.score)}">${result.score}%</div>
            <div class="result-actions">
                <button class="btn btn-secondary" onclick="viewResultDetail('${result._id}')">View Details</button>
            </div>
        </div>
    `).join('');
}

function getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

function viewResultDetail(resultId) {
    localStorage.setItem('resultId', resultId);
    window.location.href = '/results.html';
}

async function activateAccount() {
    const activationKey = document.getElementById('activationKey').value;
    
    if (!activationKey) {
        alert('Please enter an activation key');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ activationKey })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Premium subscription activated successfully!');
            
            // Update user data
            const user = JSON.parse(localStorage.getItem('user'));
            user.subscriptionStatus = 'premium';
            localStorage.setItem('user', JSON.stringify(user));
            
            // Refresh page
            window.location.reload();
        } else {
            alert(data.message || 'Activation failed');
        }
    } catch (error) {
        console.error('Activation error:', error);
        alert('Connection error. Please try again.');
    }
}

console.log('Dashboard JS loaded successfully');