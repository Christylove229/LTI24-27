import React, { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import SignUpForm from '../components/Auth/SignUpForm';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  console.log('[Auth] Component rendering, isLogin:', isLogin);

  return isLogin ? (
    <LoginForm onToggleMode={() => setIsLogin(false)} />
  ) : (
    <SignUpForm onToggleMode={() => setIsLogin(true)} />
  );
};

export default Auth;