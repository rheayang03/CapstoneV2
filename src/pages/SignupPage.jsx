import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/auth/Header';
import HeroImage from '@/components/auth/HeroImage';
import SocialProviders from '@/components/auth/SocialProviders';
import AuthCard from '@/components/auth/AuthCard';
import { Eye, EyeOff } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { signInWithGoogle } from '@/lib/google';

const SignupPage = () => {
  const { socialLogin, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(''); // 🔹 error state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 🔹 Check password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setPending(true);
    try {
      const name = `${firstName} ${lastName}`.trim();
      const res = await register({ name, email, password, contactNumber });
      if (res?.success && res?.pending) {
        try {
          sessionStorage.setItem('verify_token', res.verifyToken || '');
          sessionStorage.setItem(
            'pending_user',
            JSON.stringify(res.user || {})
          );
        } catch {}
        navigate('/verify');
      } else if (res?.success) {
        navigate('/');
      } else {
        setError(res?.error || 'Signup failed. Please try again.');
      }
    } finally {
      setPending(false);
    }
  };

  const handleSocial = async (provider, payload /* e or credential */) => {
    setPending(true);

    if (provider === 'google-credential') {
      try {
        const res = await loginWithGoogle(payload);
        if (!res?.success) throw new Error('Google failed');
        if (res?.pending) {
          try {
            sessionStorage.setItem('verify_token', res.verifyToken || '');
            sessionStorage.setItem(
              'pending_user',
              JSON.stringify(res.user || {})
            );
          } catch {}
        }
        navigate(res?.pending ? '/verify' : '/');
      } catch (e) {
        alert('Google authentication failed. Please try again.');
      }
    } else if (provider === 'google') {
      try {
        const credential = await signInWithGoogle();
        const res = await loginWithGoogle(credential);
        if (!res?.success) throw new Error('Google failed');
        if (res?.pending) {
          try {
            sessionStorage.setItem('verify_token', res.verifyToken || '');
            sessionStorage.setItem(
              'pending_user',
              JSON.stringify(res.user || {})
            );
          } catch {}
        }
        navigate(res?.pending ? '/verify' : '/');
      } catch (e) {
        alert('Google authentication failed. Please try again.');
      }
    } else {
      await socialLogin(provider);
    }

    setPending(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        <main className="flex-1 flex flex-col md:flex-row items-center px-4 md:px-6 gap-8 max-w-7xl mx-auto w-full py-8">
          <div className="w-full md:w-1/2 flex flex-col gap-6 max-w-lg order-2 md:order-1">
            <div className="w-full max-w-md mx-auto md:mx-0">
              <AuthCard title="Create Account" compact>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder=" "
                        className="peer w-full h-10 px-3 pt-3 pb-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                      <label
                        htmlFor="firstName"
                        className="absolute left-3 text-muted-foreground pointer-events-none transition-all top-0 -translate-y-1/2 text-xs px-1 bg-white peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
                      >
                        First Name
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder=" "
                        className="peer w-full h-10 px-3 pt-3 pb-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                      <label
                        htmlFor="lastName"
                        className="absolute left-3 text-muted-foreground pointer-events-none transition-all top-0 -translate-y-1/2 text-xs px-1 bg-white peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
                      >
                        Last Name
                      </label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      id="contactNumber"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder=" "
                      className="peer w-full h-10 px-3 pt-3 pb-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                    <label
                      htmlFor="contactNumber"
                      className="absolute left-3 text-muted-foreground pointer-events-none transition-all top-0 -translate-y-1/2 text-xs px-1 bg-white peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
                    >
                      Contact Number
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=" "
                      className="peer w-full h-10 px-3 pt-3 pb-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-3 text-muted-foreground pointer-events-none transition-all top-0 -translate-y-1/2 text-xs px-1 bg-white peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
                    >
                      Email
                    </label>
                  </div>

                  {/* Password with toggle */}
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=" "
                      className="peer w-full h-10 px-3 pt-3 pb-3 pr-9 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                      minLength={8}
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-3 text-muted-foreground pointer-events-none transition-all top-0 -translate-y-1/2 text-xs px-1 bg-white peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {!showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The password should be at least 8 characters.
                  </p>

                  {/* Confirm Password with toggle */}
                  <div>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder=" "
                        className="peer w-full h-10 px-3 pt-3 pb-3 pr-9 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                      <label
                        htmlFor="confirmPassword"
                        className="absolute left-3 text-muted-foreground pointer-events-none transition-all top-0 -translate-y-1/2 text-xs px-1 bg-white peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:px-0 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white"
                      >
                        Confirm Password
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {!showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="mt-1 text-sm text-red-500">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-md transition-colors duration-300"
                  >
                    {pending ? 'Processing...' : 'Sign Up'}
                  </button>
                </form>

                {/* Only show Google social login */}
                <SocialProviders
                  onSocial={handleSocial}
                  pending={pending}
                  providers={['google']}
                />

                <p className="mt-4 text-sm text-gray-600 text-center">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="font-semibold text-primary hover:text-primary-dark"
                    type="button"
                  >
                    Log in here
                  </button>
                </p>
              </AuthCard>
            </div>
          </div>
          <HeroImage src="/images/b1bc6b54-fe3f-45eb-8a39-005cc575deef.png" />
        </main>
      </div>
    </PageTransition>
  );
};

export default SignupPage;
