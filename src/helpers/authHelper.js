import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { isAuthGuardActive } from 'constants/defaultValues';
import { getCurrentUser } from './Utils';

const ProtectedRoute = ({
  component: Component,
  roles = undefined,
  ...rest
}) => {
  const setComponent = (props) => {
    if (isAuthGuardActive) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        if (roles) {
          if (roles.includes(currentUser.role)) {
            return <Component {...props} />;
          }
          return (
            <Redirect
              to={{
                pathname: '/unauthorized',
                state: { from: props.location },
              }}
            />
          );
        }
        return <Component {...props} />;
      }
      return (
        <Redirect
          to={{
            pathname: '/user/login',
            state: { from: props.location },
          }}
        />
      );
    }
    return <Component {...props} />;
  };

  return <Route {...rest} render={setComponent} />;
};

// eslint-disable-next-line import/prefer-default-export
export { ProtectedRoute };

// Simple authentication helper for development
// This bypasses Firebase authentication issues

export const mockLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Simple validation - accept any email/password for demo
      if (email && password) {
        const user = {
          id: 1,
          email: email,
          name: 'Demo User',
          role: 'admin',
          token: 'mock-jwt-token-' + Date.now()
        };
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', user.token);
        
        resolve(user);
      } else {
        reject(new Error('Email and password are required'));
      }
    }, 1000);
  });
};

export const mockLogout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  return Promise.resolve();
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
