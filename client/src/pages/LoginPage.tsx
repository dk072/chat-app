import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import PageTransition from '../components/ui/PageTransition';
import LoginCard from '../components/auth/LoginCard';
import RegisterCard from '../components/auth/RegisterCard';
import PremiumLoadingScreen from '../components/ui/PremiumLoadingScreen';

const LoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(() => location.pathname !== '/register');

  useEffect(() => {
    setIsLoginView(location.pathname !== '/register');
  }, [location.pathname]);

  if (loading) {
    return <PremiumLoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-900 overflow-hidden relative">
      <AnimatedBackground />

      <div className="z-10 w-full px-4 flex justify-center">
        <PageTransition>
          {isLoginView ? (
            <LoginCard
              onToggle={() => {
                setIsLoginView(false);
                navigate('/register');
              }}
            />
          ) : (
            <RegisterCard
              onToggle={() => {
                setIsLoginView(true);
                navigate('/login');
              }}
            />
          )}
        </PageTransition>
      </div>
    </div>
  );
};

export default LoginPage;
