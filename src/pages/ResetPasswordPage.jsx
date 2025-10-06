import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/auth/Header';
import PageTransition from '@/components/PageTransition';
import authService from '@/api/services/authService';

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

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const alertRef = useRef(null);

  const token = query.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if ((error || success) && alertRef.current) {
      alertRef.current.focus();
    }
  }, [error, success]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    try {
      let res;
      if (token) {
        res = await authService.resetPassword(token, password);
      } else {
        if (!email || !code) {
          setError('Email and code are required.');
          setPending(false);
          return;
        }
        res = await authService.resetPasswordWithCode(email, code, password);
      }
      if (res?.success) {
        setSuccess('Your password has been reset. You can now log in.');
      } else {
        setError(res?.message || 'Reset failed. The link may have expired.');
      }
    } catch (err) {
      setError(err?.message || 'Could not reset password.');
    } finally {
      setPending(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
            <h1 className="text-2xl font-semibold mb-2">Reset Password</h1>
            <p className="text-sm text-gray-600 mb-4">
              Choose a new password for your account.
            </p>

            {(error || success) && (
              <div
                className={`p-3 mb-4 rounded-lg text-sm ${
                  success
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
                role="alert"
                tabIndex={-1}
                ref={alertRef}
              >
                {success || error}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="space-y-4"
              noValidate
              aria-busy={pending || undefined}
            >
              {!token && (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                    required
                    disabled={pending}
                  />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\s+/g, '').slice(0, 6))
                    }
                    placeholder="6-digit code"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                    required
                    disabled={pending}
                  />
                </>
              )}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                  required
                  minLength={8}
                  disabled={pending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                  required
                  minLength={8}
                  disabled={pending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                {pending ? (
                  <>
                    <Spinner /> Resetting…
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <Link
                to="/login"
                className="text-primary underline underline-offset-2"
              >
                Back to Login
              </Link>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => navigate('/forgot-password')}
                type="button"
              >
                Resend link
              </button>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default ResetPasswordPage;
