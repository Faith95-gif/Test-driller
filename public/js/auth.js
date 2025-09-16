// Authentication JavaScript

let isLoginMode = true;

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleBtn = document.getElementById('toggleBtn');
    const toggleText = document.getElementById('toggleText');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Toggle between login and register forms
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggleBtn">Register here</a>';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            toggleText.innerHTML = 'Already have an account? <a href="#" id="toggleBtn">Login here</a>';
        }
        
        // Re-attach event listener to the new toggle button
        document.getElementById('toggleBtn').addEventListener('click', arguments.callee);
        
        // Clear messages
        hideMessages();
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        try {
            showLoading(this.querySelector('button[type="submit"]'));
            
            console.log('Attempting login with:', { email, password: '***' });
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);
            
            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showSuccess('Login successful! Redirecting...');
                
                // Redirect based on user role
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                }, 1500);
                
            } else {
                showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Connection error. Please try again.');
        } finally {
            hideLoading(this.querySelector('button[type="submit"]'));
        }
    });

    // Handle register form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!fullName || !email || !password || !confirmPassword) {
            showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }

        try {
            showLoading(this.querySelector('button[type="submit"]'));
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fullName, email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showSuccess('Registration successful! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                
            } else {
                showError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showError('Connection error. Please try again.');
        } finally {
            hideLoading(this.querySelector('button[type="submit"]'));
        }
    });

    // Utility functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    function hideMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    function showLoading(button) {
        button.disabled = true;
        button.textContent = 'Loading...';
    }

    function hideLoading(button) {
        button.disabled = false;
        button.textContent = isLoginMode ? 'Login' : 'Create Account';
    }

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.id) {
        if (user.role === 'admin') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/dashboard.html';
        }
    }

    console.log('Auth JS loaded successfully');
});