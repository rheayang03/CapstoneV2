import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/auth/Header';
import PageTransition from '@/components/PageTransition';
import authService from '@/api/services/authService';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const ResetCodePage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const alertRef = useRef(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const qemail = query.get('email') || '';
    if (qemail) setEmail(qemail);
    try {
      const stored = sessionStorage.getItem('reset_email');
      if (!qemail && stored) setEmail(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if ((error || success) && alertRef.current) alertRef.current.focus();
  }, [error, success]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !code || code.length < 6) {
      setError('Enter your email and the 6-digit code.');
      return;
    }
    setPending(true);
    try {
      const res = await authService.verifyPasswordReset(email, code);
      if (!res?.success || !res?.resetToken) {
        setError(res?.message || 'Invalid or expired code.');
        return;
      }
      try {
        sessionStorage.setItem('reset_token', res.resetToken);
      } catch {}
      setSuccess('Code verified. Proceed to set a new password.');
      navigate(`/set-new-password?token=${encodeURIComponent(res.resetToken)}`);
    } catch (err) {
      setError('Could not verify code.');
    } finally {
      setPending(false);
    }
  };

  const onResend = async () => {
    setError('');
    setSuccess('');
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setPending(true);
    try {
      await authService.requestPasswordReset(email);
      setSuccess('If an account exists, a new code has been sent.');
    } catch (e) {
      setError('Could not resend code.');
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
            <h1 className="text-2xl font-semibold mb-2">
              Enter Verification Code
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              We sent a 6-digit code to your email.
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
              className="space-y-3"
              noValidate
              aria-busy={pending || undefined}
            >
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary tracking-widest"
                required
                disabled={pending}
              />
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                {pending ? 'Verifying…' : 'Verify Code'}
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
                type="button"
                onClick={onResend}
                disabled={pending || !email}
                className="text-primary hover:text-primary-dark disabled:opacity-60"
              >
                Resend code
              </button>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default ResetCodePage;
