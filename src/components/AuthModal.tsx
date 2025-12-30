import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { createAndSendOTP, verifyOTP, resendOTP } from '../lib/otp';
import { createCompany, findCompanyByEmailDomain, getAdminRoleId, isFirstUserInCompany } from '../lib/companies';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const [mode, setMode] = useState<'signup' | 'login' | 'forgot-password'>('signup');
  const [step, setStep] = useState<'form' | 'otp'>('form'); // For signup OTP verification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Signup form state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Forgot password state
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotPasswordOtpId, setForgotPasswordOtpId] = useState<string | null>(null);

  // Resend timer countdown
  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async (email: string, purpose: 'signup' | 'password_reset') => {
    try {
      setLoading(true);
      setError(null);
      
      const otpIdValue = await createAndSendOTP(email, purpose);
      
      if (purpose === 'signup') {
        setOtpId(otpIdValue);
        setSignupEmail(email);
        setStep('otp');
      } else {
        setForgotPasswordOtpId(otpIdValue);
        setForgotPasswordStep('otp');
      }
      
      setResendTimer(60); // 60 seconds cooldown
      setSuccess('OTP sent to your email!');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    const email = mode === 'signup' ? signupEmail : forgotPasswordData.email;
    const purpose = mode === 'signup' ? 'signup' : 'password_reset';
    
    await handleSendOTP(email, purpose);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!signupData.name || !signupData.email || !signupData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Send OTP - Company creation happens after OTP verification
      await handleSendOTP(signupData.email, 'signup');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      // Verify OTP
      const isValid = await verifyOTP(signupEmail, otp, 'signup');
      
      if (!isValid) {
        setError('Invalid or expired OTP. Please try again.');
        setLoading(false);
        return;
      }

      // Extract company name from email domain
      const domain = signupEmail.split('@')[1];
      const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Company';

      // Find or create company
      let existingCompany = await findCompanyByEmailDomain(signupEmail);
      let companyId: string;

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        try {
          const company = await createCompany(companyName, domain);
          companyId = company.id;
        } catch (companyError: any) {
          // If company creation fails (e.g., duplicate name), try with unique name
          const uniqueCompanyName = `${companyName} ${Date.now()}`;
          const company = await createCompany(uniqueCompanyName, domain);
          companyId = company.id;
        }
      }

      // Check if first user (will be admin)
      const isFirstUser = await isFirstUserInCompany(companyId);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupData.password,
        options: {
          data: {
            name: signupData.name,
            phone: signupData.phone || null
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Get Admin role if first user
      const roleId = isFirstUser 
        ? await getAdminRoleId()
        : null; // Will be assigned by admin later

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: signupEmail,
            name: signupData.name,
            phone: signupData.phone || null,
            company_id: companyId,
            role_id: roleId,
            status: 'active'
          }
        ]);

      if (userError && !userError.message.includes('duplicate')) {
        console.error('Error creating user:', userError);
        // Continue anyway - user is created in auth
      }

      // Close modal and redirect
      onOpenChange(false);
      navigate('/dashboard');
      
      // Reset form
      setSignupData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setOtp('');
      setStep('form');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (loginError) {
        console.error('Login error:', loginError);
        throw loginError;
      }

      if (!data.user) {
        throw new Error('Login failed - no user data returned');
      }

      console.log('Login successful, user:', data.user.email);

      // Reset form first
      setLoginData({
        email: '',
        password: ''
      });

      // Close modal
      onOpenChange(false);

      // Navigate to dashboard
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!forgotPasswordData.email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await handleSendOTP(forgotPasswordData.email, 'password_reset');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    }
  };

  const handleForgotPasswordOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!forgotPasswordData.otp || forgotPasswordData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const isValid = await verifyOTP(forgotPasswordData.email, forgotPasswordData.otp, 'password_reset');
      
      if (!isValid) {
        setError('Invalid or expired OTP. Please try again.');
        setLoading(false);
        return;
      }

      setForgotPasswordStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!forgotPasswordData.newPassword || !forgotPasswordData.confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (forgotPasswordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: forgotPasswordData.newPassword
      });

      if (resetError) throw resetError;

      setSuccess('Password reset successfully! Redirecting to login...');
      
      setTimeout(() => {
        setMode('login');
        setForgotPasswordStep('email');
        setForgotPasswordData({
          email: '',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('form');
    setMode('signup');
    setForgotPasswordStep('email');
    setError(null);
    setSuccess(null);
    setOtp('');
    setSignupEmail('');
    setResendTimer(0);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetModal();
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 outline-none overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
            <Dialog.Title className="text-2xl font-bold mb-1">
              {mode === 'signup' && step === 'form' && 'Create Your Account'}
              {mode === 'signup' && step === 'otp' && 'Verify Your Email'}
              {mode === 'login' && 'Welcome Back'}
              {mode === 'forgot-password' && 'Reset Password'}
            </Dialog.Title>
            <p className="text-blue-100 text-sm">
              {mode === 'signup' && step === 'form' && 'Start your 14-day free trial. No credit card required.'}
              {mode === 'signup' && step === 'otp' && 'Enter the OTP sent to your email'}
              {mode === 'login' && 'Sign in to access your CRM dashboard'}
              {mode === 'forgot-password' && 'Enter your email to receive reset OTP'}
            </p>
          </div>

          {/* Tabs - Only show when not in OTP or reset steps */}
          {(step === 'form' && forgotPasswordStep === 'email') && (
            <div className="flex border-b border-gray-200 bg-white">
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  resetModal();
                }}
                className={cn(
                  "flex-1 py-4 px-4 text-center font-semibold text-sm transition-all",
                  mode === 'signup'
                    ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                  resetModal();
                }}
                className={cn(
                  "flex-1 py-4 px-4 text-center font-semibold text-sm transition-all",
                  mode === 'login'
                    ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                Sign In
              </button>
            </div>
          )}

          {/* Form */}
          <div className="px-6 py-6 bg-gray-50">
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 p-3.5 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-green-800 text-sm font-medium">
                {success}
              </div>
            )}

            {/* Signup Form */}
            {mode === 'signup' && step === 'form' && (
              <form onSubmit={handleSignupSubmit} className="space-y-5 bg-white p-6 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Your company will be created automatically</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone Number <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    'Continue with Email Verification'
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 mt-4 pt-4 border-t border-gray-200">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</a>
                </p>
              </form>
            )}

            {/* OTP Verification Step */}
            {mode === 'signup' && step === 'otp' && (
              <form onSubmit={handleOTPVerification} className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2">
                    We've sent a 6-digit OTP to
                  </p>
                  <p className="font-semibold text-gray-900">{signupEmail}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Enter OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0}
                    className={cn(
                      "flex items-center gap-2",
                      resendTimer > 0 
                        ? "text-gray-400 cursor-not-allowed" 
                        : "text-blue-600 hover:underline"
                    )}
                  >
                    <RefreshCw className={cn("h-4 w-4", resendTimer > 0 && "animate-spin")} />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </form>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5 bg-white p-6 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setForgotPasswordData({ ...forgotPasswordData, email: loginData.email });
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <p className="text-sm text-center text-gray-600 mt-4 pt-4 border-t border-gray-200">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {/* Forgot Password - Email Step */}
            {mode === 'forgot-password' && forgotPasswordStep === 'email' && (
              <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={forgotPasswordData.email}
                      onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send Reset OTP'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotPasswordStep('email');
                  }}
                  className="w-full text-center text-sm text-gray-600 hover:text-blue-600"
                >
                  <ArrowLeft className="h-4 w-4 inline mr-2" />
                  Back to Login
                </button>
              </form>
            )}

            {/* Forgot Password - OTP Step */}
            {mode === 'forgot-password' && forgotPasswordStep === 'otp' && (
              <form onSubmit={handleForgotPasswordOTP} className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2">
                    Enter the OTP sent to
                  </p>
                  <p className="font-semibold text-gray-900">{forgotPasswordData.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Enter OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={forgotPasswordData.otp}
                    onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordStep('email')}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0}
                    className={cn(
                      "flex items-center gap-2",
                      resendTimer > 0 
                        ? "text-gray-400 cursor-not-allowed" 
                        : "text-blue-600 hover:underline"
                    )}
                  >
                    <RefreshCw className={cn("h-4 w-4", resendTimer > 0 && "animate-spin")} />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || forgotPasswordData.otp.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </form>
            )}

            {/* Forgot Password - Reset Step */}
            {mode === 'forgot-password' && forgotPasswordStep === 'reset' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotPasswordData.newPassword}
                      onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, newPassword: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotPasswordData.confirmPassword}
                      onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
