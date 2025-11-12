const API_URL = 'http://127.0.0.1:3000';
let currentUser = null;

// Show alert message
function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert px-6 py-4 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
  alertDiv.textContent = message;
  document.getElementById('alertContainer').appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 4000);
}

// Handle Register
async function handleRegister(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    age: Number(document.getElementById('regAge').value) || 0,
    field: document.getElementById('regField').value,
  };

  try {
    const res = await fetch(`${API_URL}/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      showAlert("Registration successful! Please login", "success");
      e.target.reset();
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } else {
      showAlert(result.error || "Registration failed", "error");
    }
  } catch (error) {
    showAlert("Network error. Please try again.", "error");
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();

  const data = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    
    const result = await res.json()

    if (res.ok) {
      showAlert("Login successful", "success");
      localStorage.setItem('authToken', result.token);
      e.target.reset();
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1500)
    } else {
      showAlert(result.error || "Login failed", "error")
    }
  } catch (error) {
     showAlert("Network error. Please try again.", "error");
  }
}

// Load Profile
async function loadProfile() {
  const token = localStorage.getItem('authToken')
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await res.json();

    if (res.ok) {
      currentUser = result.user
      document.getElementById('displayName').textContent = result.user.name;
      document.getElementById('displayEmail').textContent = result.user.email;
      document.getElementById('displayAge').textContent = result.user.age;
      document.getElementById('displayField').textContent = result.user.field;
      document.getElementById('displayCreatedAt').textContent = new Date(result.user.created_at).toLocaleDateString();
      
      document.getElementById('editName').value = result.user.name;
      document.getElementById('editEmail').value = result.user.email;
      document.getElementById('editAge').value = result.user.age;
      document.getElementById('editField').value = result.user.field;
    } else {
      showAlert('Failed to load profile', 'error');
      logout();
    }
  } catch (error) {
    showAlert("Network error. Please try again.", "error");
  }
}
// Toggle Edit Mode
function toggleEditMode() {
  const viewMode = document.getElementById('viewMode')
  const editMode = document.getElementById('editMode')
  const editBtn = document.getElementById('editBtn')

  if (viewMode.style.display !== 'none') {
    viewMode.style.display = 'none'
    editMode.style.display = 'block'
    editBtn.style.display = 'none'
  } else {
    viewMode.style.display = 'block'
    editMode.style.display = 'none'
    editBtn.style.display = 'block'
  }
}

// Handle Update Profile
async function handleUpdateProfile(e) {
  e.preventDefault();
  const token = localStorage.getItem('authToken');
  const data = {
    name: document.getElementById('editName').value,
    age: parseInt(document.getElementById('editAge').value),
    field: document.getElementById('editField').value
  };

  try {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok) {
      showAlert('Profile updated successfully!');
      toggleEditMode();
      loadProfile();
    } else {
      showAlert(result.error || 'Update failed', 'error');
    }
  } catch (err) {
    showAlert('Network error. Please try again.', 'error');
  }
}

// Handle Change Password
async function handleChangePassword(e) {
  e.preventDefault();
  const token = localStorage.getItem('authToken');
  const data = {
    oldPassword: document.getElementById('oldPassword').value,
    newPassword: document.getElementById('newPassword').value
  };

  try {
    const res = await fetch(`${API_URL}/profile/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok) {
      showAlert('Password changed successfully!');
      e.target.reset();
    } else {
      showAlert(result.error || 'Password change failed', 'error');
    }
  } catch (err) {
    showAlert('Network error. Please try again.', 'error');
  }
}

// Handle Forgot Password
async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  const data = { email };

  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok) {
      // Hide the form and show success message
      showAlert('Reset link sent to your email');
      document.getElementById('successMessage').style.display = 'block';
      document.getElementById('sentEmailDisplay').textContent = email;
    } else {
      showAlert(result.error || 'Request failed', 'error');
    }
  } catch (err) {
    showAlert('Network error. Please try again.', 'error');
  }
}

// Check Reset Token from URL
function checkResetToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    showAlert('Missing token or Invalid reset link', 'error');
    setTimeout(() => {
      window.location.href = "forgot-password.html";
    }, 1500);
  }
}

// Handle Reset Password
async function handleResetPassword(e) {
  e.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    showAlert('Invalid reset link', 'error');
    return;
  }

  const newPassword = document.getElementById('resetNewPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;

  // Check if passwords match
  if (newPassword !== confirmPassword) {
    showAlert('Passwords do not match', 'error');
    return;
  }

  const data = {
    token,
    newPassword: newPassword
  };

  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok) {
      showAlert('Password reset successful! Please login.', 'success');
      e.target.reset();
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } else {
      showAlert(result.error || 'Reset failed', 'error');
    }
  } catch (err) {
    showAlert('Network error. Please try again.', 'error');
  }
}

// Logout
function logout() {
  localStorage.removeItem('authToken')
  currentUser = null;
  showAlert('Logged out successfully!')
  setTimeout(() => {
    window.location.href = 'login.html'
  }, 1500)
}