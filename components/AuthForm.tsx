import React, { useState, FormEvent } from 'react';

interface AuthFormProps {
  isRegister: boolean;
  onSubmit: (email: string, password: string, villageName?: string) => void;
  errorMessage: string | null;
  isLoading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isRegister, onSubmit, errorMessage, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [villageName, setVillageName] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [villageNameError, setVillageNameError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    if (!value) return 'E-mail je povinný.';
    if (!/\S+@\S+\.\S+/.test(value)) return 'Zadejte platný e-mail.';
    return null;
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Heslo je povinné.';
    if (value.length < 6) return 'Heslo musí mít alespoň 6 znaků.';
    return null;
  };

  const validateVillageName = (value: string) => {
    if (isRegister && !value) return 'Název vesnice je povinný.';
    return null;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const emailErrMsg = validateEmail(email);
    const passwordErrMsg = validatePassword(password);
    const villageNameErrMsg = validateVillageName(villageName);

    setEmailError(emailErrMsg);
    setPasswordError(passwordErrMsg);
    setVillageNameError(villageNameErrMsg);

    if (!emailErrMsg && !passwordErrMsg && !villageNameErrMsg) {
      onSubmit(email, password, villageName);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-stone-800 p-8 rounded-lg shadow-xl w-full max-w-sm border border-stone-700">
      <h2 className="text-3xl font-bold text-amber-200 text-center mb-6">
        {isRegister ? 'Registrace' : 'Přihlášení'}
      </h2>

      {errorMessage && (
        <p role="alert" className="bg-red-700 text-white text-sm p-3 rounded-md mb-4 text-center">
          {errorMessage}
        </p>
      )}

      <div className="mb-4">
        <label htmlFor="email" className="block text-stone-300 text-sm font-semibold mb-2">
          E-mail:
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
          onBlur={() => setEmailError(validateEmail(email))}
          className={`w-full p-3 rounded-md bg-stone-700 text-stone-100 border ${
            emailError ? 'border-red-500' : 'border-stone-600'
          } focus:outline-none focus:ring-2 focus:ring-orange-500`}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
          disabled={isLoading}
        />
        {emailError && (
          <p id="email-error" className="text-red-400 text-xs mt-1">
            {emailError}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-stone-300 text-sm font-semibold mb-2">
          Heslo:
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
          onBlur={() => setPasswordError(validatePassword(password))}
          className={`w-full p-3 rounded-md bg-stone-700 text-stone-100 border ${
            passwordError ? 'border-red-500' : 'border-stone-600'
          } focus:outline-none focus:ring-2 focus:ring-orange-500`}
          aria-invalid={!!passwordError}
          aria-describedby={passwordError ? 'password-error' : undefined}
          disabled={isLoading}
        />
        {passwordError && (
          <p id="password-error" className="text-red-400 text-xs mt-1">
            {passwordError}
          </p>
        )}
      </div>

      {isRegister && (
        <div className="mb-6">
          <label htmlFor="villageName" className="block text-stone-300 text-sm font-semibold mb-2">
            Název vesnice:
          </label>
          <input
            type="text"
            id="villageName"
            value={villageName}
            onChange={(e) => { setVillageName(e.target.value); setVillageNameError(null); }}
            onBlur={() => setVillageNameError(validateVillageName(villageName))}
            className={`w-full p-3 rounded-md bg-stone-700 text-stone-100 border ${
              villageNameError ? 'border-red-500' : 'border-stone-600'
            } focus:outline-none focus:ring-2 focus:ring-orange-500`}
            aria-invalid={!!villageNameError}
            aria-describedby={villageNameError ? 'village-name-error' : undefined}
            disabled={isLoading}
          />
          {villageNameError && (
            <p id="village-name-error" className="text-red-400 text-xs mt-1">
              {villageNameError}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        className={`w-full py-3 px-4 rounded-md font-bold text-lg transition-colors duration-200 ${
          isLoading
            ? 'bg-stone-600 text-stone-400 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
        }`}
        disabled={isLoading}
        aria-label={isLoading ? 'Probíhá načítání...' : (isRegister ? 'Registrovat se' : 'Přihlásit se')}
      >
        {isLoading ? 'Probíhá načítání...' : (isRegister ? 'Registrovat se' : 'Přihlásit se')}
      </button>
    </form>
  );
};

export default AuthForm;