import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  TrendingUp, 
  TrendingDown,
  Wallet, 
  KeyRound, 
  Sparkles,
  ChevronLeft,
  DollarSign,
  PieChart,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Check
} from 'lucide-react';

const Auth = () => {
  const { 
    isSetupComplete, 
    checkSetup, 
    login, 
    setup, 
    loginWithGoogle, 
    requestEmergencyRecovery, 
    verifyEmergencyRecovery,
    hasBoundEmail,
    maskedEmail 
  } = useStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  // Recovery State
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState('request'); // 'request' or 'verify'
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [sentMaskedEmail, setSentMaskedEmail] = useState('');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '534810784499-nqlllp8mu0dhljpb768trr3u80g1vuj8.apps.googleusercontent.com';

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  // Initialize Google Identity Services (GIS) ID token flow
  useEffect(() => {
    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              setLoading(true);
              const res = await loginWithGoogle({ credential: response.credential });
              setLoading(false);
              if (res.success) {
                setAccessGranted(true);
              } else {
                setError(res.message || 'Access Denied for this Google account.');
              }
            }
          }
        });
      } catch (e) {
        console.warn('GIS Init warning:', e);
      }
    }
  }, [googleClientId, loginWithGoogle]);

  const handleGoogleAuth = () => {
    setError('');
    
    // First try standard Google Identity Services prompt
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to OAuth2 token client if One Tap prompt was skipped
            fallbackOAuthClient();
          }
        });
        return;
      } catch (err) {
        fallbackOAuthClient();
        return;
      }
    }

    fallbackOAuthClient();
  };

  const fallbackOAuthClient = () => {
    if (window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setLoading(false);
              setError(tokenResponse.error_description || 'Google sign-in cancelled or blocked.');
              return;
            }
            if (tokenResponse.access_token) {
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const googleProfile = await userRes.json();
                
                if (googleProfile.email) {
                  const res = await loginWithGoogle({
                    email: googleProfile.email,
                    name: googleProfile.name || 'Nirob',
                    googleId: googleProfile.sub
                  });
                  if (res.success) {
                    setAccessGranted(true);
                  } else {
                    setError(res.message || 'Access Denied for this Google account.');
                  }
                } else {
                  setError('Failed to retrieve verified email from Google.');
                }
              } catch (fetchErr) {
                setError('Failed to verify Google profile. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          },
        });
        
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        setLoading(false);
        console.error('Google OAuth init error:', err);
        setError('Google OAuth popup failed. Please use Master Password or reset via email.');
      }
    } else {
      setError('Google Sign-In service is loading. Please try again in a few seconds.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setLoading(true);
    
    try {
      if (!isSetupComplete) {
        const res = await setup(password);
        if (!res.success) {
          setError(res.message || 'Initialization failed');
        } else {
          setAccessGranted(true);
        }
      } else {
        const res = await login(password);
        if (!res.success) {
          setError(res.message || 'Invalid password. Please try again.');
        } else {
          setAccessGranted(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRecovery = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const emailToSend = recoveryEmailInput.trim() || undefined;
    const res = await requestEmergencyRecovery(emailToSend);
    setLoading(false);

    if (res.success) {
      setSentMaskedEmail(res.data?.maskedEmail || 'your email');
      setSuccessMessage(res.data?.message || 'Recovery code dispatched to your email.');
      setRecoveryStep('verify');
    } else {
      setError(res.message || 'Failed to send recovery code.');
    }
  };

  const handleVerifyRecovery = async (e) => {
    e.preventDefault();
    if (!recoveryOtp || !newMasterPassword) return;
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const res = await verifyEmergencyRecovery(recoveryOtp.trim(), newMasterPassword);
    setLoading(false);

    if (res.success) {
      setAccessGranted(true);
      setSuccessMessage(res.message || 'Password successfully updated.');
    } else {
      setError(res.message || 'Verification failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070c14] text-slate-100 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Background Subtle Ambient Glows */}
      <div className="absolute -top-32 left-1/4 w-[650px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[650px] h-[400px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />

      {/* Main Dual-Column Container: Center-Aligned and Responsive */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center justify-center min-h-full">
        
        {/* Top/First on Mobile & Right Column on Desktop: Centered Authentication Card */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center w-full my-auto">
          <div className="w-full max-w-[430px] bg-[#0d1522]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl shadow-black/80">
            
            {/* Mobile Header Brand Tag (Visible on mobile for clear branding) */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6 pb-4 border-b border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
                <TrendingUp size={18} />
              </div>
              <h1 className="text-base font-extrabold text-white tracking-tight">Nirob Expense Ledger</h1>
            </div>

            {/* Card Header */}
            <div className="flex flex-col items-center text-center mb-6 sm:mb-7">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 sm:mb-4 shadow-lg shadow-emerald-500/10">
                {accessGranted ? (
                  <CheckCircle2 size={28} className="text-emerald-400 animate-in zoom-in-75 duration-300" />
                ) : isRecoveryMode ? (
                  <KeyRound size={26} className="text-emerald-400" />
                ) : (
                  <ShieldCheck size={26} className="text-emerald-400" />
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isRecoveryMode 
                  ? 'Master Password Recovery' 
                  : isSetupComplete 
                    ? 'Secure Sign In' 
                    : 'Create Master Password'}
              </h2>
              
              <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
                {isRecoveryMode 
                  ? (recoveryStep === 'request' 
                      ? 'Enter your recovery email to receive a single-use verification code.' 
                      : `Enter the 6-digit code sent to ${sentMaskedEmail} to update your password.`)
                  : isSetupComplete 
                    ? 'Authenticate to unlock your expense ledger.' 
                    : 'Set up your master key to initialize and encrypt your financial ledger.'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-2xl text-xs mb-5 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-2xl text-xs mb-5 flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Main Form */}
            {!isRecoveryMode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Master Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {isSetupComplete ? 'Master Password' : 'New Master Password'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#080d17] border border-slate-700/80 rounded-2xl px-4 py-3.5 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm tracking-widest transition-all shadow-inner"
                      autoFocus
                    />
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={loading || accessGranted}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {accessGranted ? (
                    <span className="flex items-center gap-2 text-black">
                      <CheckCircle2 size={18} /> Access Granted
                    </span>
                  ) : loading ? (
                    'Verifying credentials...'
                  ) : isSetupComplete ? (
                    <>
                      <span>Unlock Ledger</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <span>Initialize Master Vault</span>
                      <Sparkles size={16} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0d1522] px-3 text-slate-500 text-[10px] font-bold tracking-widest">or single sign-on</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading || accessGranted}
                  className="w-full py-3 px-4 rounded-2xl bg-[#080d17] hover:bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {/* Password Recovery Link */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(true);
                      setRecoveryStep('request');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                  >
                    Forgot master password? Reset via email
                  </button>
                </div>
              </form>
            ) : (
              /* Password Recovery Form */
              <div className="space-y-4">
                {recoveryStep === 'request' ? (
                  <form onSubmit={handleRequestRecovery} className="space-y-4">
                    {hasBoundEmail ? (
                      <div className="bg-[#080d17] border border-slate-800 rounded-2xl p-4 text-center space-y-1">
                        <p className="text-xs text-slate-400">Recovery email address:</p>
                        <p className="font-semibold text-sm text-emerald-400 font-mono">{maskedEmail}</p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
                        <div className="relative">
                          <input 
                            type="email"
                            required
                            placeholder="yourname@gmail.com"
                            value={recoveryEmailInput}
                            onChange={(e) => setRecoveryEmailInput(e.target.value)}
                            className="w-full bg-[#080d17] border border-slate-700/80 rounded-2xl px-4 py-3 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                          />
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Sending code...' : 'Send Recovery Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyRecovery} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit Recovery Code</label>
                      <input 
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={recoveryOtp}
                        onChange={(e) => setRecoveryOtp(e.target.value)}
                        className="w-full bg-[#080d17] border border-slate-700/80 rounded-2xl px-4 py-3 text-center text-xl font-mono tracking-[8px] font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 shadow-inner"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Master Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Enter new password"
                          value={newMasterPassword}
                          onChange={(e) => setNewMasterPassword(e.target.value)}
                          className="w-full bg-[#080d17] border border-slate-700/80 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || accessGranted}
                      className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      {loading ? 'Verifying...' : 'Reset Password & Sign In'}
                    </button>
                  </form>
                )}

                {/* Back Button */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <ChevronLeft size={14} />
                    <span>Back to sign in</span>
                  </button>
                </div>
              </div>
            )}

            {/* Footer Assurance */}
            <div className="mt-7 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Bank-Grade Encryption</span>
              </span>
              <span className="text-slate-400 font-medium">Nirob Ledger v2.0</span>
            </div>

          </div>
        </div>

        {/* Left Column (Desktop Only): Financial Showcase Dashboard Preview */}
        <div className="order-2 lg:order-1 lg:col-span-7 hidden lg:flex flex-col justify-center space-y-6">
          
          {/* Header Brand Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Financial Operating System</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Nirob Expense Ledger</h2>
            </div>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-white tracking-normal leading-[1.25]">
              Intelligent Financial Tracking & <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">Wealth Control.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
              Track essential obligations, monitor multi-fund cashflow, and visualize your financial growth in real-time.
            </p>
          </div>

          {/* Interactive Financial Snapshot Card */}
          <div className="bg-[#0e1624]/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
            
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Portfolio Balance</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">BDT 284,500</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ArrowUpRight size={12} /> +14.2%
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monthly Net Cashflow</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">+BDT 115,000</span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">Active</span>
                </div>
              </div>
            </div>

            {/* Glowing Financial Growth Line Chart SVG */}
            <div className="relative pt-1">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Cashflow Trend (Past 30 Days)
                </span>
                <span className="text-emerald-400 font-mono font-bold">+28.6% Growth</span>
              </div>

              <div className="h-28 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="finGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="70" x2="500" y2="70" stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="110" x2="500" y2="110" stroke="#1e293b" strokeWidth="1" />

                  {/* Area Fill */}
                  <path
                    d="M 0 95 C 70 85, 120 100, 180 60 C 240 25, 300 65, 360 40 C 420 15, 460 30, 500 10 L 500 120 L 0 120 Z"
                    fill="url(#finGradient)"
                  />

                  {/* Emerald Stroke Curve */}
                  <path
                    d="M 0 95 C 70 85, 120 100, 180 60 C 240 25, 300 65, 360 40 C 420 15, 460 30, 500 10"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Pulsing Highlight Dot */}
                  <circle cx="500" cy="10" r="5" fill="#10b981" />
                  <circle cx="500" cy="10" r="10" fill="#10b981" opacity="0.3" className="animate-ping" />
                </svg>
              </div>
            </div>

            {/* Live Financial Ledger Micro Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090f1a] border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <ArrowDownRight size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Monthly Salary</p>
                    <p className="text-[10px] text-slate-400">Fund: Primary Account</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">+BDT 180,000</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#090f1a] border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                    <ArrowUpRight size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Essential Bills</p>
                    <p className="text-[10px] text-slate-400">Rent & Utilities • Paid</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-400 font-mono">-BDT 35,000</span>
              </div>
            </div>

          </div>

          {/* Feature Highlights Pills */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <Check size={13} className="text-emerald-400" /> Multi-Fund Tracking
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <Check size={13} className="text-emerald-400" /> Essential Bills Manager
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <Check size={13} className="text-emerald-400" /> Instant PDF Statements
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Auth;
