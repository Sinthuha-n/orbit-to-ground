export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  image?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  expiresInMins?: number;
}

export interface LoginResponse extends User {
  accessToken: string;
  refreshToken?: string;
  token?: string; // Legacy DummyJSON alias
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
}

export interface RegisterResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates login input fields.
 */
export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

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

/**
 * Validates registration input fields.
 */
export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

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
