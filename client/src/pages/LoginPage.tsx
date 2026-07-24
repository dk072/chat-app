import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import PageTransition from '../components/ui/PageTransition';
import LoginCard from '../components/auth/LoginCard';
import RegisterCard from '../components/auth/RegisterCard';

const LoginPage: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(() => location.pathname !== '/register');

  useEffect(() => {
    setIsLoginView(location.pathname !== '/register');
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-950 text-white select-none relative overflow-hidden">
        <AnimatedBackground />
        <div className="z-10 flex flex-col items-center justify-center glass-panel p-10 rounded-3xl shadow-glass-dark border border-white/5 bg-slate-900/50 md:backdrop-blur-xl">
          <div className="text-6xl animate-bounce mb-6">💬</div>
          <h2 className="text-3xl font-outfit font-extrabold tracking-widest bg-gradient-to-r from-brand-400 to-indigo-500 bg-clip-text text-transparent animate-pulse">
            CHIME
          </h2>
          <div className="mt-8 flex flex-col items-center">
            <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mb-4 relative">
              <div className="absolute top-0 left-0 h-full bg-brand-500 w-full animate-[shimmer_1.5s_infinite]" style={{ transformOrigin: 'left' }} />
            </div>
            <span className="text-xs text-slate-400 max-w-[250px] text-center font-medium">
              Connecting to secure server...
            </span>
          </div>
        </div>
      </div>
    );
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
