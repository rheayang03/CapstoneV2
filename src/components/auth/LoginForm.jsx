import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';

const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

const LoginForm = ({
  email,
  password,
  pending,
  error,
  emailError,
  passwordError,
  remember = false,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onSubmit,
  onForgotPassword,
}) => {
  const alertRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (error && alertRef.current) {
      alertRef.current.focus();
    }
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <>
      {error && (
        <div
          className="p-3 mb-4 bg-red-50 text-red-700 rounded-md text-sm"
          role="alert"
          tabIndex={-1}
          ref={alertRef}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
        aria-busy={pending || undefined}
      >
        <div>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => onEmailChange?.(e.target.value)}
              placeholder=" "
              className="peer w-full h-10 px-3 pt-3 pb-3 text-sm border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
              required
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              disabled={pending}
              autoFocus
            />
            <label
              htmlFor="email"
              className="absolute left-3 text-muted-foreground pointer-events-none transition-all
                top-0 -translate-y-1/2 text-xs px-1 bg-white
                peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0
                peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
            >
              Email
            </label>
          </div>
          {emailError && (
            <p id="email-error" className="mt-1 text-sm text-red-700">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange?.(e.target.value)}
              placeholder=" "
              className="peer w-full h-10 px-3 pt-3 pb-3 pr-9 text-sm border border-gray-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
              required
              autoComplete="current-password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              disabled={pending}
              minLength={8}
            />
            <label
              htmlFor="password"
              className="absolute left-3 text-muted-foreground pointer-events-none transition-all
                top-0 -translate-y-1/2 text-xs px-1 bg-white
                peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0
                peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50"
              disabled={pending}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {!showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {passwordError && (
            <p id="password-error" className="mt-1 text-sm text-red-700">
              {passwordError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={!!remember}
              onChange={(e) => onRememberChange?.(e.target.checked)}
              disabled={pending}
            />
            <span className="text-sm text-gray-700">Remember me</span>
          </label>

          <button
            type="button"
            className="text-sm text-primary underline underline-offset-2 disabled:opacity-60"
            onClick={onForgotPassword}
            disabled={pending}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors duration-300 inline-flex items-center justify-center"
        >
          {pending ? (
            <>
              <Spinner /> Processing...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>
    </>
  );
};

LoginForm.propTypes = {
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  pending: PropTypes.bool,
  error: PropTypes.string,
  emailError: PropTypes.string,
  passwordError: PropTypes.string,
  remember: PropTypes.bool,
  onEmailChange: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onRememberChange: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  onForgotPassword: PropTypes.func,
};

export default LoginForm;
