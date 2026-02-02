/* Login Page JavaScript - FIXED VERSION */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');

  // Check if already logged in
  fetch('/api/auth/me', {
    credentials: 'same-origin'
  })
    .then(res => {
      if (res.ok) {
        window.location.href = '/admin';
      }
    })
    .catch(() => {});

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.style.display = 'none';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (response.ok) {
        // Successful login - redirect after short delay
        setTimeout(() => {
          window.location.href = '/admin';
        }, 100);
      } else {
        errorMessage.textContent = data.error || 'Login failed';
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorMessage.textContent = 'Network error. Please try again.';
      errorMessage.style.display = 'block';
    }
  });
});
