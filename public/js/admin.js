// Admin JavaScript

let currentUser = null;
let subjects = [];
let questions = [];
let users = [];
let currentTab = 'dashboard';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Initialize admin panel
    initializeAdmin();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        window.location.href = '/login';
        return;
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/dashboard';
        return;
    }
    
    currentUser = user;
    
    // Update welcome message
    const welcomeElement = document.getElementById('adminWelcome');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${user.fullName}!`;
    }
}

function initializeAdmin() {
    // Set up tab navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        });
    }
    
    // Add subject button
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    if (addSubjectBtn) {
        addSubjectBtn.addEventListener('click', () => showSubjectModal());
    }
    
    // Add question button
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => showQuestionModal());
    }
    
    // Subject form
    const subjectForm = document.getElementById('subjectForm');
    if (subjectForm) {
        subjectForm.addEventListener('submit', handleSubjectSubmit);
    }
    
    // Question form
    const questionForm = document.getElementById('questionForm');
    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
    }
    
    // Modal close buttons
    setupModalEventListeners();
    
    // Filters
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyQuestionFilters);
    }
}

function setupModalEventListeners() {
    // Subject modal
    const closeSubjectModal = document.getElementById('closeSubjectModal');
    const cancelSubject = document.getElementById('cancelSubject');
    
    if (closeSubjectModal) {
        closeSubjectModal.addEventListener('click', () => hideSubjectModal());
    }
    if (cancelSubject) {
        cancelSubject.addEventListener('click', () => hideSubjectModal());
    }
    
    // Question modal
    const closeQuestionModal = document.getElementById('closeQuestionModal');
    const cancelQuestion = document.getElementById('cancelQuestion');
    
    if (closeQuestionModal) {
        closeQuestionModal.addEventListener('click', () => hideQuestionModal());
    }
    if (cancelQuestion) {
        cancelQuestion.addEventListener('click', () => hideQuestionModal());
    }
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        const subjectModal = document.getElementById('subjectModal');
        const questionModal = document.getElementById('questionModal');
        
        if (event.target === subjectModal) {
            hideSubjectModal();
        }
        if (event.target === questionModal) {
            hideQuestionModal();
        }
    });
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
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'subjects':
            loadSubjects();
            break;
        case 'questions':
            loadQuestions();
            break;
        case 'users':
            loadUsers();
            break;
    }
}

async function loadDashboardData() {
    await loadDashboardStats();
    await loadSubjects(); // Load subjects for dropdowns
}

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update stats
            document.getElementById('totalUsers').textContent = data.totalUsers;
            document.getElementById('activeUsers').textContent = data.activeUsers;
            document.getElementById('premiumUsers').textContent = data.premiumUsers;
            document.getElementById('totalSubjects').textContent = data.totalSubjects;
            document.getElementById('totalQuestions').textContent = data.totalQuestions;
            document.getElementById('totalExams').textContent = data.totalExams;
            
            // Load recent activity
            loadRecentActivity(data.recentUsers, data.recentExams);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function loadRecentActivity(recentUsers, recentExams) {
    const activityContainer = document.getElementById('recentActivity');
    
    let activityHTML = '<h3>Recent Users</h3>';
    
    if (recentUsers && recentUsers.length > 0) {
        activityHTML += recentUsers.map(user => `
            <div class="activity-item">
                <strong>${user.fullName}</strong> registered
                <span class="activity-time">${new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
        `).join('');
    } else {
        activityHTML += '<p>No recent user registrations</p>';
    }
    
    activityHTML += '<h3>Recent Exams</h3>';
    
    if (recentExams && recentExams.length > 0) {
        activityHTML += recentExams.map(exam => `
            <div class="activity-item">
                <strong>${exam.user.fullName}</strong> took ${exam.subject.name} exam (${exam.score}%)
                <span class="activity-time">${new Date(exam.completedAt).toLocaleDateString()}</span>
            </div>
        `).join('');
    } else {
        activityHTML += '<p>No recent exam activity</p>';
    }
    
    activityContainer.innerHTML = activityHTML;
}

async function loadSubjects() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/subjects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            subjects = data.subjects;
            
            if (currentTab === 'subjects') {
                displaySubjectsTable();
            }
            
            // Update dropdowns
            updateSubjectDropdowns();
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

function displaySubjectsTable() {
    const subjectsTable = document.getElementById('subjectsTable');
    
    if (!subjects || subjects.length === 0) {
        subjectsTable.innerHTML = '<p>No subjects found. Add your first subject!</p>';
        return;
    }
    
    subjectsTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${subjects.map(subject => `
                    <tr>
                        <td>${subject.name}</td>
                        <td>${subject.code}</td>
                        <td>${subject.description || 'No description'}</td>
                        <td>
                            <span class="status ${subject.isActive ? 'active' : 'inactive'}">
                                ${subject.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>${new Date(subject.createdAt).toLocaleDateString()}</td>
                        <td class="actions">
                            <button class="btn-small btn-secondary" onclick="editSubject('${subject._id}')">Edit</button>
                            <button class="btn-small btn-danger" onclick="deleteSubject('${subject._id}', '${subject.name}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function updateSubjectDropdowns() {
    const dropdowns = ['filterSubject', 'questionSubject'];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            const options = subjects.map(subject => 
                `<option value="${subject._id}">${subject.name}</option>`
            ).join('');
            
            if (dropdownId === 'filterSubject') {
                dropdown.innerHTML = '<option value="">All Subjects</option>' + options;
            } else {
                dropdown.innerHTML = '<option value="">Select Subject</option>' + options;
            }
        }
    });
}

async function loadQuestions(filters = {}) {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        
        if (filters.subject) params.append('subject', filters.subject);
        if (filters.year) params.append('year', filters.year);
        
        const response = await fetch(`/api/admin/questions?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            questions = data.questions;
            displayQuestionsTable();
        }
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function displayQuestionsTable() {
    const questionsTable = document.getElementById('questionsTable');
    
    if (!questions || questions.length === 0) {
        questionsTable.innerHTML = '<p>No questions found. Add your first question!</p>';
        return;
    }
    
    questionsTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Question</th>
                    <th>Subject</th>
                    <th>Year</th>
                    <th>Topic</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${questions.map(question => `
                    <tr>
                        <td class="question-text">${question.questionText.substring(0, 100)}...</td>
                        <td>${question.subject.name}</td>
                        <td>${question.year}</td>
                        <td>${question.topic}</td>
                        <td>
                            <span class="difficulty ${question.difficulty}">
                                ${question.difficulty}
                            </span>
                        </td>
                        <td>
                            <span class="status ${question.isActive ? 'active' : 'inactive'}">
                                ${question.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="actions">
                            <button class="btn-small btn-secondary" onclick="editQuestion('${question._id}')">Edit</button>
                            <button class="btn-small btn-danger" onclick="deleteQuestion('${question._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            users = data.users;
            displayUsersTable();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsersTable() {
    const usersTable = document.getElementById('usersTable');
    
    if (!users || users.length === 0) {
        usersTable.innerHTML = '<p>No users found.</p>';
        return;
    }
    
    usersTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subscription</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.fullName}</td>
                        <td>${user.email}</td>
                        <td>
                            <span class="subscription ${user.subscriptionStatus}">
                                ${user.subscriptionStatus}
                            </span>
                        </td>
                        <td>
                            <span class="status ${user.isActive ? 'active' : 'inactive'}">
                                ${user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td class="actions">
                            <button class="btn-small btn-secondary" onclick="toggleUserStatus('${user._id}', ${!user.isActive})">
                                ${user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn-small btn-primary" onclick="upgradeToPremium('${user._id}')">
                                Upgrade
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Modal Functions
function showSubjectModal(subjectId = null) {
    const modal = document.getElementById('subjectModal');
    const form = document.getElementById('subjectForm');
    const title = document.getElementById('subjectModalTitle');
    
    form.reset();
    
    if (subjectId) {
        // Edit mode
        const subject = subjects.find(s => s._id === subjectId);
        if (subject) {
            document.getElementById('subjectId').value = subject._id;
            document.getElementById('subjectName').value = subject.name;
            document.getElementById('subjectCode').value = subject.code;
            document.getElementById('subjectDescription').value = subject.description || '';
            title.textContent = 'Edit Subject';
        }
    } else {
        // Add mode
        document.getElementById('subjectId').value = '';
        title.textContent = 'Add New Subject';
    }
    
    modal.style.display = 'flex';
}

function hideSubjectModal() {
    document.getElementById('subjectModal').style.display = 'none';
}

function showQuestionModal(questionId = null) {
    const modal = document.getElementById('questionModal');
    const form = document.getElementById('questionForm');
    const title = document.getElementById('questionModalTitle');
    
    form.reset();
    
    if (questionId) {
        // Edit mode
        const question = questions.find(q => q._id === questionId);
        if (question) {
            document.getElementById('questionId').value = question._id;
            document.getElementById('questionSubject').value = question.subject._id;
            document.getElementById('questionYear').value = question.year;
            document.getElementById('questionTopic').value = question.topic;
            document.getElementById('questionText').value = question.questionText;
            
            // Load options
            question.options.forEach(option => {
                document.getElementById(`option${option.label}`).value = option.text;
            });
            
            document.getElementById('correctAnswer').value = question.correctAnswer;
            document.getElementById('questionExplanation').value = question.explanation || '';
            document.getElementById('questionDifficulty').value = question.difficulty;
            
            title.textContent = 'Edit Question';
        }
    } else {
        // Add mode
        document.getElementById('questionId').value = '';
        title.textContent = 'Add New Question';
    }
    
    modal.style.display = 'flex';
}

function hideQuestionModal() {
    document.getElementById('questionModal').style.display = 'none';
}

// Form Handlers
async function handleSubjectSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const subjectId = formData.get('subjectId') || '';
    
    const subjectData = {
        name: formData.get('subjectName'),
        code: formData.get('subjectCode'),
        description: formData.get('subjectDescription')
    };
    
    try {
        const token = localStorage.getItem('token');
        const url = subjectId ? `/api/admin/subjects/${subjectId}` : '/api/admin/subjects';
        const method = subjectId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subjectData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            hideSubjectModal();
            loadSubjects();
        } else {
            alert(result.message || 'Error saving subject');
        }
    } catch (error) {
        console.error('Error saving subject:', error);
        alert('Error saving subject. Please try again.');
    }
}

async function handleQuestionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const questionId = formData.get('questionId') || '';
    
    const questionData = {
        subject: formData.get('questionSubject'),
        year: parseInt(formData.get('questionYear')),
        topic: formData.get('questionTopic'),
        questionText: formData.get('questionText'),
        options: [
            { label: 'A', text: formData.get('optionA') },
            { label: 'B', text: formData.get('optionB') },
            { label: 'C', text: formData.get('optionC') },
            { label: 'D', text: formData.get('optionD') }
        ],
        correctAnswer: formData.get('correctAnswer'),
        explanation: formData.get('questionExplanation'),
        difficulty: formData.get('questionDifficulty')
    };
    
    try {
        const token = localStorage.getItem('token');
        const url = questionId ? `/api/admin/questions/${questionId}` : '/api/admin/questions';
        const method = questionId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(questionData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            hideQuestionModal();
            loadQuestions();
        } else {
            alert(result.message || 'Error saving question');
        }
    } catch (error) {
        console.error('Error saving question:', error);
        alert('Error saving question. Please try again.');
    }
}

// Action Functions
function editSubject(subjectId) {
    showSubjectModal(subjectId);
}

async function deleteSubject(subjectId, subjectName) {
    if (!confirm(`Are you sure you want to delete "${subjectName}"? This will also delete all related questions.`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/subjects/${subjectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadSubjects();
        } else {
            alert(result.message || 'Error deleting subject');
        }
    } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Error deleting subject. Please try again.');
    }
}

function editQuestion(questionId) {
    showQuestionModal(questionId);
}

async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadQuestions();
        } else {
            alert(result.message || 'Error deleting question');
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question. Please try again.');
    }
}

async function toggleUserStatus(userId, isActive) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isActive })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadUsers();
        } else {
            alert(result.message || 'Error updating user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user. Please try again.');
    }
}

async function upgradeToPremium(userId) {
    if (!confirm('Upgrade this user to premium?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subscriptionStatus: 'premium' })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            loadUsers();
        } else {
            alert(result.message || 'Error upgrading user');
        }
    } catch (error) {
        console.error('Error upgrading user:', error);
        alert('Error upgrading user. Please try again.');
    }
}

function applyQuestionFilters() {
    const subject = document.getElementById('filterSubject').value;
    const year = document.getElementById('filterYear').value;
    
    loadQuestions({ subject, year });
}

// Add CSS for admin styles
const adminStyles = `
    <style>
        .btn-small {
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
            margin: 0 0.25rem;
        }
        
        .status.active { color: #10b981; font-weight: 600; }
        .status.inactive { color: #ef4444; font-weight: 600; }
        
        .subscription.premium { color: #8b5cf6; font-weight: 600; }
        .subscription.free { color: #6b7280; }
        
        .difficulty.easy { color: #10b981; }
        .difficulty.medium { color: #f59e0b; }
        .difficulty.hard { color: #ef4444; }
        
        .question-text { 
            max-width: 300px; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap; 
        }
        
        .actions {
            white-space: nowrap;
        }
        
        .activity-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .activity-time {
            color: #6b7280;
            font-size: 0.8rem;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', adminStyles);

console.log('Admin JS loaded successfully');