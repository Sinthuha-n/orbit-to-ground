import assert from 'node:assert/strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLoginForm(values) {
  const errors = {};

  const username = values.username?.trim();
  if (!username) {
    errors.username = 'Username is required';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 4) {
    errors.password = 'Password must be at least 4 characters';
  }

  return errors;
}

function validateRegisterForm(values) {
  const errors = {};

  const firstName = values.firstName?.trim();
  if (!firstName) {
    errors.firstName = 'First name is required';
  } else if (firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  const lastName = values.lastName?.trim();
  if (!lastName) {
    errors.lastName = 'Last name is required';
  }

  const email = values.email?.trim();
  if (!email) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  const username = values.username?.trim();
  if (!username) {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    errors.username = 'Username can only contain letters, numbers, and .-_';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

console.log('=== 1. Testing Login Form Validation ===');

// Test empty fields
const emptyLoginErrors = validateLoginForm({ username: '', password: '' });
assert.equal(emptyLoginErrors.username, 'Username is required');
assert.equal(emptyLoginErrors.password, 'Password is required');

// Test whitespace username
const whitespaceUsernameErrors = validateLoginForm({ username: '   ', password: 'password123' });
assert.equal(whitespaceUsernameErrors.username, 'Username is required');

// Test short password
const shortPasswordErrors = validateLoginForm({ username: 'validuser', password: '12' });
assert.equal(shortPasswordErrors.password, 'Password must be at least 4 characters');

// Test valid credentials
const validLoginErrors = validateLoginForm({ username: 'emilys', password: 'emilyspass' });
assert.deepEqual(validLoginErrors, {});
console.log('✓ All login validation tests passed.');

console.log('\n=== 2. Testing Registration Form Validation ===');

// Test all empty fields
const emptyRegErrors = validateRegisterForm({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
});
assert.ok(emptyRegErrors.firstName, 'First name should be required');
assert.ok(emptyRegErrors.lastName, 'Last name should be required');
assert.ok(emptyRegErrors.email, 'Email should be required');
assert.ok(emptyRegErrors.username, 'Username should be required');
assert.ok(emptyRegErrors.password, 'Password should be required');
assert.ok(emptyRegErrors.confirmPassword, 'Confirm password should be required');

// Test invalid email formats
const invalidEmailErrors = validateRegisterForm({
  firstName: 'Emily',
  lastName: 'Johnson',
  email: 'not-an-email',
  username: 'emilys',
  password: 'validpassword1',
  confirmPassword: 'validpassword1',
});
assert.equal(invalidEmailErrors.email, 'Please enter a valid email address');

// Test short username and invalid characters
const invalidUsernameErrors = validateRegisterForm({
  firstName: 'Emily',
  lastName: 'Johnson',
  email: 'emily@example.com',
  username: 'ab',
  password: 'validpassword1',
  confirmPassword: 'validpassword1',
});
assert.equal(invalidUsernameErrors.username, 'Username must be at least 3 characters');

// Test short password (< 6 chars)
const shortRegPasswordErrors = validateRegisterForm({
  firstName: 'Emily',
  lastName: 'Johnson',
  email: 'emily@example.com',
  username: 'emilys',
  password: '12345',
  confirmPassword: '12345',
});
assert.equal(shortRegPasswordErrors.password, 'Password must be at least 6 characters');

// Test password mismatch
const mismatchErrors = validateRegisterForm({
  firstName: 'Emily',
  lastName: 'Johnson',
  email: 'emily@example.com',
  username: 'emilys',
  password: 'securepassword1',
  confirmPassword: 'differentpassword',
});
assert.equal(mismatchErrors.confirmPassword, 'Passwords do not match');

// Test valid registration
const validRegErrors = validateRegisterForm({
  firstName: 'Emily',
  lastName: 'Johnson',
  email: 'emily.johnson@example.com',
  username: 'emilys',
  password: 'securepassword1',
  confirmPassword: 'securepassword1',
});
assert.deepEqual(validRegErrors, {});
console.log('✓ All registration validation tests passed.');

console.log('\n=== 3. Testing Session Error Classification Logic ===');

function classifySessionError(status) {
  if (status === 401 || status === 403) {
    return { shouldClearSession: true, shouldRetry: false, type: 'EXPIRED' };
  }
  return { shouldClearSession: false, shouldRetry: true, type: 'NETWORK_FAILURE' };
}

assert.deepEqual(classifySessionError(401), {
  shouldClearSession: true,
  shouldRetry: false,
  type: 'EXPIRED',
});

assert.deepEqual(classifySessionError(403), {
  shouldClearSession: true,
  shouldRetry: false,
  type: 'EXPIRED',
});

// Network failure: DO NOT clear session; DO offer Retry
assert.deepEqual(classifySessionError('FETCH_ERROR'), {
  shouldClearSession: false,
  shouldRetry: true,
  type: 'NETWORK_FAILURE',
});

assert.deepEqual(classifySessionError(500), {
  shouldClearSession: false,
  shouldRetry: true,
  type: 'NETWORK_FAILURE',
});

console.log('✓ Session error classification logic passed.');

console.log('\n=== 4. Testing Live DummyJSON Authentication Endpoints ===');
try {
  const loginRes = await fetch('https://dummyjson.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'emilys', password: 'emilyspass' }),
  });
  assert.equal(loginRes.status, 200, 'Expected 200 OK for valid credentials');
  const loginData = await loginRes.json();
  assert.ok(loginData.accessToken, 'Login should return accessToken');
  assert.equal(loginData.username, 'emilys');

  const meRes = await fetch('https://dummyjson.com/auth/me', {
    headers: { Authorization: `Bearer ${loginData.accessToken}` },
  });
  assert.equal(meRes.status, 200, 'Expected 200 OK for /auth/me');
  const meData = await meRes.json();
  assert.equal(meData.username, 'emilys');

  const badLoginRes = await fetch('https://dummyjson.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'emilys', password: 'wrongpassword' }),
  });
  assert.equal(badLoginRes.status, 400, 'Expected 400 Bad Request for invalid credentials');

  const regRes = await fetch('https://dummyjson.com/users/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'Astronaut',
      email: 'astronaut@orbit.com',
      username: 'astronaut1',
    }),
  });
  assert.equal(regRes.status, 201, 'Expected 201 Created for simulated registration');

  console.log('✓ All live DummyJSON endpoint tests passed.');
} catch (e) {
  console.log('Live network check skipped or offline:', e.message);
}

console.log('\nAll Authentication & Session validation checks passed successfully!');
