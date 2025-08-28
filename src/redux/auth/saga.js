import { all, call, fork, put, takeEvery } from 'redux-saga/effects';
import { adminRoot, currentUser, UserRole } from 'constants/defaultValues';
import { setCurrentUser } from 'helpers/Utils';
import {
  LOGIN_USER,
  REGISTER_USER,
  LOGOUT_USER,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
} from '../contants';

import {
  loginUserSuccess,
  loginUserError,
  registerUserSuccess,
  registerUserError,
  forgotPasswordSuccess,
  forgotPasswordError,
  resetPasswordSuccess,
  resetPasswordError,
} from './actions';

export function* watchLoginUser() {
  // eslint-disable-next-line no-use-before-define
  yield takeEvery(LOGIN_USER, loginWithEmailPassword);
}

const loginWithEmailPasswordAsync = async (email, password) => {
  // Use real admin login API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Login failed');
    }

    const responseData = await response.json();
    
    // Handle the nested data structure from the API
    const data = responseData.data || responseData;
    
    return {
      access_token: data.access_token || data.token,
      user: {
        id: data.user?.id || 1, // Default ID if not provided
        email: data.user?.email || data.email,
        role: data.user?.role || data.role || 'admin'
      }
    };
  } catch (error) {
    throw new Error(error.message || 'Login failed. Please check your credentials.');
  }
};

function* loginWithEmailPassword({ payload }) {
  const { email, password } = payload.user;
  const { history } = payload;
  try {
    const loginUser = yield call(loginWithEmailPasswordAsync, email, password);
    if (loginUser) {
      // Map the API role to the expected role format
      const role = loginUser.user.role === 'admin' ? UserRole.Admin : UserRole.Editor;
      
      const item = { 
        uid: loginUser.user.id, 
        ...currentUser, 
        ...loginUser.user,
        role: role, // Use the mapped role
        token: loginUser.access_token 
      };
      
      console.log('Login successful, user item:', item);
      console.log('Access token:', loginUser.access_token);
      
      setCurrentUser(item);
      yield put(loginUserSuccess(item));
      history.push(adminRoot);
    }
  } catch (error) {
    console.error('Login error:', error);
    yield put(loginUserError(error.message || 'Login failed'));
  }
}

export function* watchRegisterUser() {
  // eslint-disable-next-line no-use-before-define
  yield takeEvery(REGISTER_USER, registerWithEmailPassword);
}

const registerWithEmailPasswordAsync = async (email, password) => {
  // Simple local registration (disabled for demo)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Registration is disabled in demo mode'));
    }, 500);
  });
};

function* registerWithEmailPassword({ payload }) {
  const { email, password } = payload.user;
  const { history } = payload;
  try {
    const registerUser = yield call(
      registerWithEmailPasswordAsync,
      email,
      password
    );
    if (!registerUser.message) {
      const item = { uid: registerUser.id, ...currentUser, ...registerUser };
      setCurrentUser(item);
      yield put(registerUserSuccess(item));
      history.push(adminRoot);
    } else {
      yield put(registerUserError(registerUser.message));
    }
  } catch (error) {
    yield put(registerUserError(error.message || 'Registration failed'));
  }
}

export function* watchLogoutUser() {
  // eslint-disable-next-line no-use-before-define
  yield takeEvery(LOGOUT_USER, logout);
}

const logoutAsync = async (history) => {
  try {
    // Simple logout - just redirect
    history.push('/user/login');
  } catch (error) {
    console.error('Logout error:', error);
    history.push('/user/login');
  }
};

function* logout({ payload }) {
  const { history } = payload;
  setCurrentUser();
  yield call(logoutAsync, history);
}

export function* watchForgotPassword() {
  // eslint-disable-next-line no-use-before-define
  yield takeEvery(FORGOT_PASSWORD, forgotPassword);
}

const forgotPasswordAsync = async (email) => {
  // Simple forgot password (disabled for demo)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Password reset is disabled in demo mode'));
    }, 500);
  });
};

function* forgotPassword({ payload }) {
  const { email } = payload.forgotUserMail;
  try {
    const forgotPasswordStatus = yield call(forgotPasswordAsync, email);
    if (!forgotPasswordStatus) {
      yield put(forgotPasswordSuccess('success'));
    } else {
      yield put(forgotPasswordError(forgotPasswordStatus.message));
    }
  } catch (error) {
    yield put(forgotPasswordError(error));
  }
}

export function* watchResetPassword() {
  // eslint-disable-next-line no-use-before-define
  yield takeEvery(RESET_PASSWORD, resetPassword);
}

const resetPasswordAsync = async (resetPasswordCode, newPassword) => {
  // Simple reset password (disabled for demo)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Password reset is disabled in demo mode'));
    }, 500);
  });
};

function* resetPassword({ payload }) {
  const { newPassword, resetPasswordCode } = payload;
  try {
    const resetPasswordStatus = yield call(
      resetPasswordAsync,
      resetPasswordCode,
      newPassword
    );
    if (!resetPasswordStatus) {
      yield put(resetPasswordSuccess('success'));
    } else {
      yield put(resetPasswordError(resetPasswordStatus.message));
    }
  } catch (error) {
    yield put(resetPasswordError(error));
  }
}

export default function* rootSaga() {
  yield all([
    fork(watchLoginUser),
    fork(watchLogoutUser),
    fork(watchRegisterUser),
    fork(watchForgotPassword),
    fork(watchResetPassword),
  ]);
}
