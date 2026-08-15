import React from 'react';

// Shared across App.js (attaches it to NavigationContainer) and
// authInterceptor.js (needs to redirect to Login from outside any component,
// e.g. when a token refresh fails).
export const navigationRef = React.createRef();
