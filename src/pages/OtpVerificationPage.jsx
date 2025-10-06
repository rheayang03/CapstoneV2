import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/auth/Header';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/components/AuthContext';

const STORAGE_KEY = 'login_otp_context';
const DIGIT_COUNT = 6;

const maskEmail = (email = '') => {
  const [name = '', domain = ''] = email.split('@');
  if (!domain) return email;
  if (name.length <= 2) return `${name.slice(0, 1)}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

const formatCountdown = (ms) => {
  if (!ms || ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

const OtpVerificationPage = () => {
  const { verifyLoginOtp, resendLoginOtp } = useAuth();
  const navigate = useNavigate();
  const alertRef = useRef(null);
  const inputRefs = useRef([]);
  const lastSubmittedRef = useRef('');

  const [context, setContext] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [digits, setDigits] = useState(() => Array(DIGIT_COUNT).fill(''));
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const expiresAt = context?.expiresAt ? Number(context.expiresAt) : null;
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? Math.max(0, expiresAt - Date.now()) : null
  );

  const code = useMemo(() => digits.join(''), [digits]);

  const expired = useMemo(() => {
    if (!expiresAt) return false;
    return Date.now() >= expiresAt;
  }, [expiresAt]);

  useEffect(() => {
    if (!context?.otpToken) {
      navigate('/login', { replace: true });
    }
  }, [context, navigate]);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const tick = () => {
      setRemaining(Math.max(0, expiresAt - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const moveFocus = useCallback((index) => {
    const target = inputRefs.current?.[index];
    if (target) {
      try {
        target.focus({ preventScroll: true });
      } catch (err) {
        target.focus();
      }
      target.select?.();
    }
  }, []);

  useEffect(() => {
    if (!expired && context?.otpToken) {
      setTimeout(() => moveFocus(0), 0);
    }
  }, [context, expired, moveFocus]);

  useEffect(() => {
    if ((error || info) && alertRef.current) {
      alertRef.current.focus();
    }
  }, [error, info]);

  const verifyCode = useCallback(async () => {
    if (pending || expired) return;
    if (!context?.otpToken) {
      setError('Session expired. Please log in again.');
      return;
    }
    if (code.length !== DIGIT_COUNT) {
      return;
    }

    lastSubmittedRef.current = code;
    setError('');
    setInfo('');
    setPending(true);
    try {
      const res = await verifyLoginOtp({
        email: context.email,
        otpToken: context.otpToken,
        code,
        remember: context.remember,
      });
      if (!res?.success || !res?.token) {
        setError(res?.message || 'Invalid or expired code.');
        return;
      }
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      setInfo('Verification successful. Redirecting...');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not verify the code.');
    } finally {
      setPending(false);
    }
  }, [code, context, expired, navigate, pending, verifyLoginOtp]);

  useEffect(() => {
    if (
      code.length === DIGIT_COUNT &&
      !pending &&
      !expired &&
      code !== lastSubmittedRef.current
    ) {
      verifyCode();
    }
  }, [code, expired, pending, verifyCode]);

  useEffect(() => {
    if (code.length < DIGIT_COUNT) {
      lastSubmittedRef.current = code;
    }
  }, [code]);

  const handleDigitInput = (index, value) => {
    const sanitized = (value || '').replace(/\D/g, '');
    if (!sanitized) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    const chars = sanitized.slice(0, DIGIT_COUNT - index).split('');
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, offset) => {
        const pos = index + offset;
        if (pos < DIGIT_COUNT) {
          next[pos] = char;
        }
      });
      return next;
    });
    setTimeout(() => {
      const targetIndex = Math.min(DIGIT_COUNT - 1, index + chars.length);
      moveFocus(targetIndex);
    }, 0);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const hasValue = Boolean(digits[index]);
      setDigits((prev) => {
        const next = [...prev];
        if (hasValue) {
          next[index] = '';
        } else if (index > 0) {
          next[index - 1] = '';
        }
        return next;
      });
      const nextFocus = hasValue ? index : Math.max(0, index - 1);
      setTimeout(() => moveFocus(nextFocus), 0);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) moveFocus(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index < DIGIT_COUNT - 1) moveFocus(index + 1);
    }
  };

  const handlePaste = (event) => {
    const text = event.clipboardData?.getData('text') || '';
    const sanitized = text.replace(/\D/g, '').slice(0, DIGIT_COUNT);
    if (!sanitized) {
      return;
    }
    event.preventDefault();
    const chars = sanitized.split('');
    setDigits(() => {
      const next = Array(DIGIT_COUNT).fill('');
      chars.forEach((char, idx) => {
        next[idx] = char;
      });
      return next;
    });
    lastSubmittedRef.current = '';
    const focusIndex = Math.min(chars.length, DIGIT_COUNT - 1);
    setTimeout(() => moveFocus(focusIndex), 0);
  };

  const handleResend = useCallback(async () => {
    if (pending || resendPending) return;
    if (!context?.email || !context?.otpToken) {
      setError('Session expired. Please log in again.');
      return;
    }
    setError('');
    setInfo('');
    setResendPending(true);
    try {
      const res = await resendLoginOtp({
        email: context.email,
        otpToken: context.otpToken,
        remember: context.remember,
      });
      if (!res?.success || !res?.otpToken) {
        setError(res?.message || 'Could not resend the code.');
        return;
      }
      const expiresIn = Number(res.expiresIn || res.otpExpiresIn || 60);
      const ttlSeconds = Math.max(30, expiresIn);
      const updated = {
        ...context,
        otpToken: res.otpToken,
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      setContext(updated);
      setDigits(Array(DIGIT_COUNT).fill(''));
      lastSubmittedRef.current = '';
      setRemaining(ttlSeconds * 1000);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      setInfo('A new code was sent to your email.');
      setTimeout(() => moveFocus(0), 0);
    } catch (err) {
      setError(err?.message || 'Could not resend the code.');
    } finally {
      setResendPending(false);
    }
  }, [context, moveFocus, pending, resendLoginOtp, resendPending]);

  const handleBack = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    navigate('/login');
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
            <h1 className="text-2xl font-semibold mb-2">Verify your login</h1>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code we sent to{' '}
              <span className="font-medium">
                {maskEmail(context?.email || '')}
              </span>
              .
            </p>
            {expiresAt && (
              <p className="text-xs text-gray-500 mb-4">
                Code expires in {formatCountdown(remaining)}
              </p>
            )}

            {(error || info) && (
              <div
                className={`p-3 mb-4 rounded-lg text-sm ${
                  info ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
                role="alert"
                tabIndex={-1}
                ref={alertRef}
              >
                {info || error}
              </div>
            )}

            <form
              onSubmit={(event) => event.preventDefault()}
              className="space-y-3"
              noValidate
              aria-busy={pending || resendPending || undefined}
            >
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${idx + 1}`}
                    value={digit}
                    onChange={(event) =>
                      handleDigitInput(idx, event.target.value)
                    }
                    onKeyDown={(event) => handleKeyDown(idx, event)}
                    disabled={pending || resendPending || expired}
                    maxLength={1}
                    className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                  />
                ))}
              </div>
              {pending && (
                <p className="text-xs text-gray-500 text-center">
                  Verifying...
                </p>
              )}
              {resendPending && (
                <p className="text-xs text-gray-500 text-center">
                  Sending new code...
                </p>
              )}
            </form>

            {expired && (
              <p className="text-xs text-red-600 mt-3">
                The code has expired. Return to the login page to request a new
                one.
              </p>
            )}

            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleBack}
                className="text-primary underline underline-offset-2"
              >
                Back to Login
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={pending || resendPending}
                className="text-primary hover:text-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Resend Code
              </button>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default OtpVerificationPage;
