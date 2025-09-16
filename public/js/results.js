// Results JavaScript

let resultData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load result data
    loadResultData();
    
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

async function loadResultData() {
    const resultId = localStorage.getItem('resultId');
    
    if (!resultId) {
        alert('No result data found. Redirecting to dashboard...');
        window.location.href = '/dashboard';
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/exams/results/${resultId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            resultData = data.result;
            displayResults();
        } else {
            throw new Error('Failed to load result data');
        }
    } catch (error) {
        console.error('Error loading results:', error);
        alert('Error loading results. Please try again.');
        window.location.href = '/dashboard';
    }
}

function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '/dashboard';
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('resultId');
        window.location.href = '/login';
    });
    
    // Print results
    document.getElementById('printResults').addEventListener('click', () => {
        window.print();
    });
    
    // Share results (simple implementation)
    document.getElementById('shareResults').addEventListener('click', shareResults);
}

function displayResults() {
    if (!resultData) return;
    
    // Display result summary
    displayResultSummary();
    
    // Display question analysis
    displayQuestionAnalysis();
    
    // Display performance chart
    displayPerformanceChart();
}

function displayResultSummary() {
    const summaryContainer = document.getElementById('resultSummary');
    
    const timeUsedMinutes = Math.floor(resultData.timeUsed / 60);
    const timeUsedSeconds = resultData.timeUsed % 60;
    const timeString = `${timeUsedMinutes}m ${timeUsedSeconds}s`;
    
    const percentage = resultData.score;
    const grade = getGrade(percentage);
    const gradeClass = getGradeClass(percentage);
    
    summaryContainer.innerHTML = `
        <div class="summary-header">
            <h2>${resultData.subject.name} ${resultData.examType === 'exam' ? 'Exam' : 'Practice'} Results</h2>
            <div class="exam-info">
                <span>Year: ${resultData.year}</span> | 
                <span>Completed: ${new Date(resultData.completedAt).toLocaleDateString()}</span>
            </div>
        </div>
        
        <div class="summary-stats">
            <div class="summary-card">
                <div class="summary-icon ${gradeClass}">📊</div>
                <div class="summary-info">
                    <h3>${percentage}%</h3>
                    <p>Overall Score</p>
                    <span class="grade ${gradeClass}">${grade}</span>
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-icon">✅</div>
                <div class="summary-info">
                    <h3>${resultData.correctAnswers}</h3>
                    <p>Correct Answers</p>
                    <span>out of ${resultData.totalQuestions}</span>
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-icon">❌</div>
                <div class="summary-info">
                    <h3>${resultData.totalQuestions - resultData.correctAnswers}</h3>
                    <p>Incorrect Answers</p>
                    <span>${Math.round(((resultData.totalQuestions - resultData.correctAnswers) / resultData.totalQuestions) * 100)}%</span>
                </div>
            </div>
            
            <div class="summary-card">
                <div class="summary-icon">⏱️</div>
                <div class="summary-info">
                    <h3>${timeString}</h3>
                    <p>Time Used</p>
                    <span>Average: ${Math.round(resultData.timeUsed / resultData.totalQuestions)}s per question</span>
                </div>
            </div>
        </div>
        
        <div class="performance-summary">
            <h3>Performance Summary</h3>
            <div class="performance-bar">
                <div class="performance-fill ${gradeClass}" style="width: ${percentage}%"></div>
            </div>
            <div class="performance-text">
                <p>${getPerformanceMessage(percentage)}</p>
            </div>
        </div>
    `;
}

function displayQuestionAnalysis() {
    const analysisContainer = document.getElementById('questionAnalysis');
    
    if (!resultData.questions || resultData.questions.length === 0) {
        analysisContainer.innerHTML = '<p>No detailed question analysis available.</p>';
        return;
    }
    
    analysisContainer.innerHTML = resultData.questions.map((questionResult, index) => {
        const question = questionResult.question;
        const isCorrect = questionResult.isCorrect;
        const userAnswer = questionResult.selectedAnswer;
        const correctAnswer = questionResult.correctAnswer;
        const timeSpent = questionResult.timeSpent || 0;
        
        return `
            <div class="analysis-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-header">
                    <div class="question-number">
                        <span class="question-num">Q${index + 1}</span>
                        <span class="question-status ${isCorrect ? 'correct' : 'incorrect'}">
                            ${isCorrect ? '✅' : '❌'}
                        </span>
                    </div>
                    <div class="question-time">
                        <span>${timeSpent}s</span>
                    </div>
                </div>
                
                <div class="question-content">
                    <p class="question-text">${question.questionText}</p>
                    
                    <div class="question-options">
                        ${question.options.map(option => `
                            <div class="option-analysis ${option.label === correctAnswer ? 'correct-answer' : ''} ${option.label === userAnswer ? 'user-answer' : ''}">
                                <span class="option-label">${option.label}</span>
                                <span class="option-text">${option.text}</span>
                                ${option.label === correctAnswer ? '<span class="correct-indicator">✓ Correct Answer</span>' : ''}
                                ${option.label === userAnswer && option.label !== correctAnswer ? '<span class="user-indicator">Your Answer</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    ${question.explanation ? `
                        <div class="explanation">
                            <h4>Explanation:</h4>
                            <p>${question.explanation}</p>
                        </div>
                    ` : ''}
                    
                    <div class="question-meta">
                        <span class="topic">Topic: ${question.topic}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayPerformanceChart() {
    const chartContainer = document.getElementById('performanceChart');
    
    // Calculate topic-wise performance
    const topicPerformance = calculateTopicPerformance();
    
    if (topicPerformance.length === 0) {
        chartContainer.innerHTML = '<p>No performance data available for chart.</p>';
        return;
    }
    
    // Simple text-based performance breakdown
    chartContainer.innerHTML = `
        <div class="performance-breakdown">
            <h3>Topic-wise Performance</h3>
            ${topicPerformance.map(topic => `
                <div class="topic-performance">
                    <div class="topic-name">${topic.name}</div>
                    <div class="topic-stats">
                        <span>${topic.correct}/${topic.total} correct</span>
                        <span class="topic-percentage">${Math.round((topic.correct / topic.total) * 100)}%</span>
                    </div>
                    <div class="topic-bar">
                        <div class="topic-fill" style="width: ${(topic.correct / topic.total) * 100}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h3>Recommendations</h3>
            ${generateRecommendations(topicPerformance)}
        </div>
    `;
}

function calculateTopicPerformance() {
    if (!resultData.questions) return [];
    
    const topicStats = {};
    
    resultData.questions.forEach(questionResult => {
        const topic = questionResult.question.topic;
        
        if (!topicStats[topic]) {
            topicStats[topic] = { total: 0, correct: 0 };
        }
        
        topicStats[topic].total++;
        if (questionResult.isCorrect) {
            topicStats[topic].correct++;
        }
    });
    
    return Object.entries(topicStats).map(([topic, stats]) => ({
        name: topic,
        total: stats.total,
        correct: stats.correct,
        percentage: Math.round((stats.correct / stats.total) * 100)
    })).sort((a, b) => b.percentage - a.percentage);
}

function generateRecommendations(topicPerformance) {
    const recommendations = [];
    
    // Find weak topics (< 60% performance)
    const weakTopics = topicPerformance.filter(topic => topic.percentage < 60);
    const strongTopics = topicPerformance.filter(topic => topic.percentage >= 80);
    
    if (weakTopics.length > 0) {
        recommendations.push(`
            <div class="recommendation">
                <h4>🎯 Focus Areas</h4>
                <p>You need more practice in: <strong>${weakTopics.map(t => t.name).join(', ')}</strong></p>
                <p>Consider reviewing these topics and taking more practice tests.</p>
            </div>
        `);
    }
    
    if (strongTopics.length > 0) {
        recommendations.push(`
            <div class="recommendation">
                <h4>💪 Strengths</h4>
                <p>You performed well in: <strong>${strongTopics.map(t => t.name).join(', ')}</strong></p>
                <p>Keep up the good work in these areas!</p>
            </div>
        `);
    }
    
    // Overall performance recommendation
    const overallScore = resultData.score;
    if (overallScore >= 80) {
        recommendations.push(`
            <div class="recommendation">
                <h4>🏆 Excellent Performance</h4>
                <p>Outstanding score! Continue practicing to maintain this level of performance.</p>
            </div>
        `);
    } else if (overallScore >= 60) {
        recommendations.push(`
            <div class="recommendation">
                <h4>👍 Good Progress</h4>
                <p>You're on the right track. Focus on weak areas to improve your score further.</p>
            </div>
        `);
    } else {
        recommendations.push(`
            <div class="recommendation">
                <h4>📚 More Practice Needed</h4>
                <p>Consider taking more practice tests and reviewing fundamental concepts.</p>
            </div>
        `);
    }
    
    return recommendations.join('');
}

function getGrade(percentage) {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Needs Improvement';
}

function getGradeClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 70) return 'very-good';
    if (percentage >= 60) return 'good';
    if (percentage >= 50) return 'fair';
    return 'poor';
}

function getPerformanceMessage(percentage) {
    if (percentage >= 80) {
        return 'Outstanding performance! You have demonstrated excellent mastery of the subject matter.';
    } else if (percentage >= 70) {
        return 'Very good work! You show strong understanding with room for minor improvements.';
    } else if (percentage >= 60) {
        return 'Good effort! Continue practicing to strengthen your knowledge in weak areas.';
    } else if (percentage >= 50) {
        return 'Fair performance. Consider reviewing fundamental concepts and taking more practice tests.';
    } else {
        return 'More practice is needed. Focus on understanding basic concepts and take additional practice tests.';
    }
}

function shareResults() {
    const shareText = `I just completed a ${resultData.subject.name} ${resultData.examType} and scored ${resultData.score}%! 📊 #JAMBPrep #StudySuccess`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My JAMB CBT Prep Results',
            text: shareText,
            url: window.location.href
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard! You can now paste it to share.');
        });
    } else {
        // Fallback: show the text in an alert
        alert(`Share this result:\n\n${shareText}`);
    }
}

// Add CSS for results page
const resultStyles = `
    <style>
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .summary-card {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .summary-icon {
            font-size: 2rem;
            padding: 1rem;
            border-radius: 8px;
            background: #e2e8f0;
        }
        
        .summary-icon.excellent { background: #d1fae5; }
        .summary-icon.very-good { background: #dbeafe; }
        .summary-icon.good { background: #fef3c7; }
        .summary-icon.fair { background: #fed7aa; }
        .summary-icon.poor { background: #fee2e2; }
        
        .performance-bar {
            height: 20px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 1rem 0;
        }
        
        .performance-fill {
            height: 100%;
            transition: width 1s ease;
        }
        
        .performance-fill.excellent { background: #10b981; }
        .performance-fill.very-good { background: #3b82f6; }
        .performance-fill.good { background: #f59e0b; }
        .performance-fill.fair { background: #f97316; }
        .performance-fill.poor { background: #ef4444; }
        
        .grade {
            font-size: 0.8rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
        }
        
        .grade.excellent { background: #d1fae5; color: #059669; }
        .grade.very-good { background: #dbeafe; color: #2563eb; }
        .grade.good { background: #fef3c7; color: #d97706; }
        .grade.fair { background: #fed7aa; color: #ea580c; }
        .grade.poor { background: #fee2e2; color: #dc2626; }
        
        .option-analysis {
            padding: 0.5rem;
            margin: 0.25rem 0;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
        }
        
        .option-analysis.correct-answer {
            background: #d1fae5;
            border-color: #10b981;
        }
        
        .option-analysis.user-answer {
            background: #fee2e2;
            border-color: #ef4444;
        }
        
        .option-analysis.correct-answer.user-answer {
            background: #d1fae5;
            border-color: #10b981;
        }
        
        .correct-indicator, .user-indicator {
            font-size: 0.8rem;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            margin-left: 0.5rem;
        }
        
        .correct-indicator {
            background: #10b981;
            color: white;
        }
        
        .user-indicator {
            background: #ef4444;
            color: white;
        }
        
        .topic-performance {
            margin-bottom: 1rem;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .topic-bar {
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .topic-fill {
            height: 100%;
            background: #3b82f6;
            transition: width 1s ease;
        }
        
        .recommendation {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .recommendation h4 {
            margin-bottom: 0.5rem;
            color: #1e40af;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', resultStyles);

console.log('Results JS loaded successfully');