import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/auth/Header';
import PageTransition from '@/components/PageTransition';
import authService from '@/api/services/authService';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const SetNewPasswordPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const alertRef = useRef(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = useMemo(() => {
    const q = query.get('token') || '';
    if (q) return q;
    try {
      return sessionStorage.getItem('reset_token') || '';
    } catch {
      return '';
    }
  }, [query]);

  useEffect(() => {
    if ((error || success) && alertRef.current) alertRef.current.focus();
  }, [error, success]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
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
      const res = await authService.confirmPasswordReset(token, password);
      if (res?.success) {
        setSuccess('Your password has been reset. You can now log in.');
        try {
          sessionStorage.removeItem('reset_token');
        } catch {}
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
            <h1 className="text-2xl font-semibold mb-2">Set New Password</h1>
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
              className="space-y-3"
              noValidate
              aria-busy={pending || undefined}
            >
              <input
                type={'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                required
                minLength={8}
                disabled={pending}
              />
              <input
                type={'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                required
                minLength={8}
                disabled={pending}
              />
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                {pending ? 'Saving…' : 'Set Password'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <Link
                to="/login"
                className="text-primary underline underline-offset-2"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default SetNewPasswordPage;
