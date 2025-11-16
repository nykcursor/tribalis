import React from 'react';
import AuthForm from '../components/AuthForm';

interface RegisterScreenProps {
  onRegister: (email: string, password: string, villageName: string) => void;
  onSwitchToLogin: () => void;
  errorMessage: string | null;
  isLoading: boolean;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onSwitchToLogin, errorMessage, isLoading }) => {
  const handleSubmit = (email: string, password: string, villageName?: string) => {
    if (villageName) {
      onRegister(email, password, villageName);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <AuthForm
        isRegister={true}
        onSubmit={handleSubmit}
        errorMessage={errorMessage}
        isLoading={isLoading}
      />
      <button
        onClick={onSwitchToLogin}
        className="mt-6 text-orange-400 hover:text-orange-300 transition-colors duration-200 text-sm md:text-base"
        disabled={isLoading}
      >
        Už máte účet? Přihlaste se zde.
      </button>
    </div>
  );
};

export default RegisterScreen;