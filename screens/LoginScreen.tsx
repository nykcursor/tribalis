import React from 'react';
import AuthForm from '../components/AuthForm';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  errorMessage: string | null;
  isLoading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSwitchToRegister, errorMessage, isLoading }) => {
  const handleSubmit = (email: string, password: string) => {
    onLogin(email, password);
  };

  return (
    <div className="flex flex-col items-center">
      <AuthForm
        isRegister={false}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
        isLoading={isLoading}
      />
      <button
        onClick={onSwitchToRegister}
        className="mt-6 text-orange-400 hover:text-orange-300 transition-colors duration-200 text-sm md:text-base"
        disabled={isLoading}
      >
        Nemáte účet? Zaregistrujte se zde.
      </button>
    </div>
  );
};

export default LoginScreen;