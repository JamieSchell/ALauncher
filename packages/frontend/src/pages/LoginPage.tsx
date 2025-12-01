/**
 * Login Page - Premium Professional UI/UX Design
 * Senior UX/UI Designer Implementation 2025
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, 
  UserPlus, 
  Minus, 
  Square, 
  X, 
  ChevronDown, 
  Info,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Gamepad2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../api/auth';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toasts, showInfo, showError, showSuccess, removeToast } = useToast();
  const { t } = useTranslation();
  const { getAnimationProps, shouldAnimate } = useOptimizedAnimation();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [launcherVersion, setLauncherVersion] = useState<string | null>(null);
  
  // Validation states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Real-time validation with toast notifications
  const validateUsername = (value: string, showToastNotification = false) => {
    if (mode === 'register') {
      if (value.length > 0 && value.length < 3) {
        setUsernameError(t('validation.usernameMinLength'));
        if (showToastNotification) {
          showInfo(t('validation.usernameMinLength'));
        }
        return false;
      }
      if (value.length > 16) {
        setUsernameError(t('validation.usernameMaxLength16'));
        if (showToastNotification) {
          showInfo(t('validation.usernameMaxLength16'));
        }
        return false;
      }
      if (value.length > 0 && !/^[a-zA-Z0-9_]+$/.test(value)) {
        setUsernameError(t('validation.usernameInvalidChars'));
        if (showToastNotification) {
          showInfo(t('validation.usernameInvalidChars'));
        }
        return false;
      }
    }
    setUsernameError('');
    return true;
  };

  const validatePassword = (value: string, showToastNotification = false) => {
    if (mode === 'register' && value.length > 0 && value.length < 6) {
      setPasswordError(t('validation.passwordMinLength'));
      if (showToastNotification) {
        showInfo(t('validation.passwordMinLength'));
      }
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateEmail = (value: string, showToastNotification = false) => {
    if (!value || value.trim() === '') {
      setEmailError(t('validation.emailRequired'));
      if (showToastNotification) {
        showInfo(t('validation.required') + '. ' + t('validation.emailRequired'));
      }
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError(t('validation.emailInvalid'));
      if (showToastNotification) {
        showInfo(t('validation.emailInvalid'));
      }
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Check for empty required fields and show toast
    if (!username) {
      setUsernameError(t('validation.usernameRequired'));
      showInfo(t('validation.fillOutField') + '. ' + t('validation.usernameRequired'));
      return;
    }
    
    if (!password) {
      setPasswordError(t('validation.passwordRequired'));
      showInfo(t('validation.fillOutField') + '. ' + t('validation.passwordRequired'));
      return;
    }
    
    if (mode === 'register' && !email) {
      setEmailError(t('validation.emailRequired'));
      showInfo(t('validation.fillOutField') + '. ' + t('validation.emailRequired'));
      return;
    }
    
    // Validate with toast notifications
    const isUsernameValid = validateUsername(username, false);
    const isPasswordValid = validatePassword(password, false);
    const isEmailValid = mode === 'register' ? validateEmail(email, false) : true;

    // Show toast notifications for invalid fields
    if (!isUsernameValid) {
      validateUsername(username, true);
    }
    if (!isPasswordValid) {
      validatePassword(password, true);
    }
    if (mode === 'register' && !isEmailValid) {
      validateEmail(email, true);
    }

    if (!isUsernameValid || !isPasswordValid || !isEmailValid) {
      // Show general validation error toast
      if (mode === 'register') {
        showInfo(t('validation.fillAllRequiredFields'));
      } else {
        showInfo(t('validation.fillAllFields'));
      }
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await authAPI.login(username, password);
        
        if (result.success && result.accessToken && result.playerProfile) {
          showSuccess(t('auth.welcomeBack') + '!');
          setTimeout(() => {
            setAuth(result.accessToken, result.playerProfile, result.role || 'USER');
            navigate('/');
          }, 500);
        } else {
          const errorMsg = result.error || t('errors.loginFailed');
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        const result = await authAPI.register(username, password, email);
        if (result.success) {
          showSuccess(t('validation.registrationSuccessful'));
          setSuccess(t('validation.registrationSuccessful'));
          setTimeout(() => {
            setMode('login');
            setError('');
            setSuccess('');
            setUsername('');
            setPassword('');
            setEmail('');
          }, 2000);
        } else {
          const errorMsg = result.error || t('errors.registrationFailed');
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const errorMsg = err.response?.data?.error || err.message || t('errors.anErrorOccurred');
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleMinimizeToTray = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeToTray();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Get launcher version
  useEffect(() => {
    const getVersion = async () => {
      if (window.electronAPI) {
        try {
          const version = await window.electronAPI.getAppVersion();
          setLauncherVersion(version);
        } catch (error) {
          console.error('Failed to get launcher version:', error);
        }
      } else {
        setLauncherVersion('1.0.143');
      }
    };
    
    getVersion();
    
    const interval = setInterval(() => {
      getVersion();
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Clear errors when switching modes
  useEffect(() => {
    setError('');
    setSuccess('');
    setUsernameError('');
    setPasswordError('');
    setEmailError('');
  }, [mode]);

  return (
    <div className="flex flex-col min-h-screen relative window-drag overflow-hidden bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Skip Link for Accessibility */}
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-base focus:left-base focus:z-[9999] focus:px-base focus:py-sm focus:bg-primary-500 focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-interactive-focus-primary focus:ring-offset-2 focus:ring-offset-background-primary"
        aria-label="Skip to login form"
      >
        Skip to login form
      </a>

      {/* Premium Top Bar - Window Controls */}
      <motion.header
        initial={shouldAnimate ? { opacity: 0, y: -20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.4 })}
        className="relative z-50 window-no-drag"
        role="banner"
        aria-label="Application title bar"
      >
        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-surface-elevated/95 via-surface-base/90 to-surface-elevated/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left side - Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/30" aria-hidden="true">
                <Gamepad2 className="text-white" size={18} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-heading">Modern Launcher</span>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center gap-1" role="toolbar" aria-label="Window controls">
              <LanguageSwitcher />
              <motion.button
                onClick={handleMinimize}
                onKeyDown={(e) => handleKeyDown(e, handleMinimize)}
                whileHover={shouldAnimate ? { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                className="p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-interactive-focus-primary focus:ring-offset-2 focus:ring-offset-surface-base"
                aria-label="Minimize window"
                type="button"
              >
                <Minus size={16} className="text-white/80 group-hover:text-white transition-colors" aria-hidden="true" />
              </motion.button>
              <motion.button
                onClick={handleMaximize}
                onKeyDown={(e) => handleKeyDown(e, handleMaximize)}
                whileHover={shouldAnimate ? { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                className="p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-interactive-focus-primary focus:ring-offset-2 focus:ring-offset-surface-base"
                aria-label="Maximize window"
                type="button"
              >
                <Square size={14} className="text-white/80 group-hover:text-white transition-colors" aria-hidden="true" />
              </motion.button>
              <motion.button
                onClick={handleMinimizeToTray}
                onKeyDown={(e) => handleKeyDown(e, handleMinimizeToTray)}
                whileHover={shouldAnimate ? { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                className="p-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-interactive-focus-primary focus:ring-offset-2 focus:ring-offset-surface-base"
                aria-label="Minimize to system tray"
                type="button"
              >
                <ChevronDown size={16} className="text-white/80 group-hover:text-white transition-colors" aria-hidden="true" />
              </motion.button>
              <motion.button
                onClick={handleClose}
                onKeyDown={(e) => handleKeyDown(e, handleClose)}
                whileHover={shouldAnimate ? { scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.2)' } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                className="p-2 rounded-lg hover:bg-red-500/20 active:bg-red-500/30 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-interactive-focus-error focus:ring-offset-2 focus:ring-offset-surface-base"
                aria-label="Close window"
                type="button"
              >
                <X size={16} className="text-white/80 group-hover:text-red-300 transition-colors" aria-hidden="true" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Beautiful Animated Background */}
      <div className="absolute inset-0 overflow-hidden pt-14">
        {/* Soft Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background-primary via-background-secondary to-background-primary" />
        
        {/* Gentle Animated Orbs */}
        {shouldAnimate && (
          <>
            <motion.div
              className="absolute top-20 left-10 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl"
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-primary-500/6 rounded-full blur-3xl"
              animate={{
                x: [0, -40, 0],
                y: [0, -50, 0],
                scale: [1, 1.15, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </>
        )}
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center pt-14 pb-8 px-6 relative z-10 window-no-drag">
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20, scale: 0.96 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : false}
          transition={getAnimationProps({ duration: 0.6 })}
          className="w-full max-w-[420px]"
        >
          {/* Card with Premium Design */}
          <div className="relative">
            {/* Subtle Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 via-primary-500/20 to-primary-500/20 rounded-3xl blur-xl opacity-60" />
            
            {/* Main Card */}
            <div className="relative bg-surface-base/80 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              {/* Logo Section */}
              <motion.div
                initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : false}
                animate={shouldAnimate ? { scale: 1, opacity: 1 } : false}
                transition={getAnimationProps({ duration: 0.4, delay: 0.2 })}
                className="flex justify-center mb-8 mt-2"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 border border-primary-400/20">
                    <Gamepad2 className="text-white" size={32} strokeWidth={2.5} />
                    {shouldAnimate && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles size={16} className="text-primary-300" fill="currentColor" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Title Section */}
              <div className="text-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
                    animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                    exit={shouldAnimate ? { opacity: 0, y: 10 } : false}
                    transition={getAnimationProps({ duration: 0.3 })}
                  >
                    <h1 className="text-3xl font-bold mb-2 text-heading leading-tight">
                      {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
                    </h1>
                    <p className="text-body-muted text-sm leading-relaxed">
                      {mode === 'login' ? t('auth.signInToContinue') : t('auth.joinUs')}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Form */}
              <form id="login-form" onSubmit={handleSubmit} className="space-y-4" aria-label={mode === 'login' ? 'Login form' : 'Registration form'}>
                {/* Username Field */}
                <motion.div
                  initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                  animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                  transition={getAnimationProps({ duration: 0.3, delay: 0.3 })}
                >
                  <label htmlFor="username-input" className="block text-sm font-medium text-body leading-normal mb-2 text-left">
                    {t('auth.username')}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body-subtle pointer-events-none z-10 transition-colors group-focus-within:text-primary-400" aria-hidden="true">
                      <User size={18} />
                    </div>
                    <input
                      id="username-input"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        validateUsername(e.target.value, false);
                      }}
                      onBlur={() => {
                        if (username) {
                          if (!validateUsername(username, false)) {
                            validateUsername(username, true);
                          }
                        }
                      }}
                      className={`w-full pl-11 pr-4 py-3 h-11 bg-surface-elevated/70 backdrop-blur-sm border rounded-xl text-heading placeholder-text-body-subtle text-sm
                        focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90
                        transition-all duration-200 ${
                        usernameError 
                          ? 'border-error-border pr-11' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      placeholder={t('auth.username')}
                      aria-label={t('auth.username')}
                      aria-required="true"
                      aria-invalid={!!usernameError}
                      aria-describedby={usernameError ? 'username-error' : undefined}
                      required
                    />
                    {usernameError && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true">
                        <AlertCircle className="text-error-400" size={18} />
                      </div>
                    )}
                  </div>
                  {usernameError && (
                    <motion.p
                      id="username-error"
                      role="alert"
                      initial={shouldAnimate ? { opacity: 0, y: -5 } : false}
                      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                      className="mt-1.5 text-xs text-error-400 flex items-center gap-1.5"
                    >
                      <AlertCircle size={12} aria-hidden="true" />
                      {usernameError}
                    </motion.p>
                  )}
                </motion.div>

                {/* Email Field (Register only) */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={shouldAnimate ? { opacity: 0, height: 0 } : false}
                      animate={shouldAnimate ? { opacity: 1, height: 'auto' } : false}
                      exit={shouldAnimate ? { opacity: 0, height: 0 } : false}
                      transition={getAnimationProps({ duration: 0.25 })}
                    >
                      <label htmlFor="email-input" className="block text-sm font-medium text-body leading-normal mb-2 text-left">
                        {t('auth.email')}
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body-subtle pointer-events-none z-10 transition-colors group-focus-within:text-primary-400" aria-hidden="true">
                          <Mail size={18} />
                        </div>
                        <input
                          id="email-input"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            validateEmail(e.target.value, false);
                          }}
                          onBlur={() => {
                            if (email) {
                              if (!validateEmail(email, false)) {
                                validateEmail(email, true);
                              }
                            }
                          }}
                          className={`w-full pl-11 pr-4 py-3 h-11 bg-surface-elevated/70 backdrop-blur-sm border rounded-xl text-heading placeholder-text-body-subtle text-sm
                            focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90
                            transition-all duration-200 ${
                            emailError 
                              ? 'border-error-border pr-11' 
                              : 'border-white/10 hover:border-white/20'
                          }`}
                          placeholder="your@email.com"
                          aria-label={t('auth.email')}
                          aria-required="true"
                          aria-invalid={!!emailError}
                          aria-describedby={emailError ? 'email-error' : undefined}
                          required
                        />
                        {emailError && (
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true">
                            <AlertCircle className="text-error-400" size={18} />
                          </div>
                        )}
                      </div>
                      {emailError && (
                        <motion.p
                          id="email-error"
                          role="alert"
                          initial={shouldAnimate ? { opacity: 0, y: -5 } : false}
                          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                          className="mt-1.5 text-xs text-error-400 flex items-center gap-1.5"
                        >
                          <AlertCircle size={12} aria-hidden="true" />
                          {emailError}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password Field */}
                <motion.div
                  initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                  animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                  transition={getAnimationProps({ duration: 0.3, delay: mode === 'register' ? 0.4 : 0.35 })}
                >
                  <label htmlFor="password-input" className="block text-sm font-medium text-body leading-normal mb-2 text-left">
                    {t('auth.password')}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body-subtle pointer-events-none z-10 transition-colors group-focus-within:text-primary-400" aria-hidden="true">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        validatePassword(e.target.value, false);
                      }}
                      onBlur={() => {
                        if (password) {
                          if (!validatePassword(password, false)) {
                            validatePassword(password, true);
                          }
                        }
                      }}
                      className={`w-full pl-11 pr-11 py-3 h-11 bg-surface-elevated/70 backdrop-blur-sm border rounded-xl text-heading placeholder-text-body-subtle text-sm
                        focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90
                        transition-all duration-200 ${
                        passwordError 
                          ? 'border-error-border pr-16' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      placeholder={t('auth.password')}
                      aria-label={t('auth.password')}
                      aria-required="true"
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? 'password-error' : undefined}
                      required
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setShowPassword(!showPassword);
                        }
                      }}
                      whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                      whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-body-subtle hover:text-primary-400 transition-colors z-10 flex items-center justify-center w-7 h-7 rounded-lg hover:bg-interactive-hover-secondary focus:outline-none focus:ring-2 focus:ring-interactive-focus-primary"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </motion.button>
                    {passwordError && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none z-10" aria-hidden="true">
                        <AlertCircle className="text-error-400" size={18} />
                      </div>
                    )}
                  </div>
                  {passwordError && (
                    <motion.p
                      id="password-error"
                      role="alert"
                      initial={shouldAnimate ? { opacity: 0, y: -5 } : false}
                      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                      className="mt-1.5 text-xs text-error-400 flex items-center gap-1.5"
                    >
                      <AlertCircle size={12} aria-hidden="true" />
                      {passwordError}
                    </motion.p>
                  )}
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading || !!usernameError || !!passwordError || (mode === 'register' && (!!emailError || !email))}
                  initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                  transition={getAnimationProps({ duration: 0.3, delay: 0.5 })}
                  whileHover={shouldAnimate && !loading ? { scale: 1.02 } : undefined}
                  whileTap={shouldAnimate && !loading ? { scale: 0.98 } : undefined}
                  className="relative w-full mx-auto px-6 py-3.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-600 
                    text-white font-semibold rounded-xl hover:from-primary-600 hover:via-primary-700 hover:to-primary-700
                    focus:outline-none focus:ring-2 focus:ring-interactive-focus-primary focus:ring-offset-2 focus:ring-offset-surface-base
                    transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed 
                    flex items-center justify-center gap-2.5 shadow-lg shadow-primary-500/30 mt-6
                    overflow-hidden group"
                  aria-label={mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                  aria-busy={loading}
                >
                  {/* Shimmer Effect */}
                  {shouldAnimate && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  )}
                  
                  {loading ? (
                    <>
                      <motion.div
                        animate={shouldAnimate ? { rotate: 360 } : false}
                        transition={shouldAnimate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                      >
                        <Lock size={18} />
                      </motion.div>
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                      <span className="text-sm">{mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}</span>
                      <ArrowRight size={16} className="opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Mode Switch */}
              <motion.div
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={shouldAnimate ? { opacity: 1 } : false}
                transition={getAnimationProps({ duration: 0.3, delay: 0.6 })}
                className="mt-6 text-center"
              >
                <motion.button
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                    setSuccess('');
                    setUsernameError('');
                    setPasswordError('');
                    setEmailError('');
                  }}
                  whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                  className="text-sm text-body-muted hover:text-primary-400 transition-colors duration-200 group"
                >
                  {mode === 'login' ? (
                    <>
                      {t('auth.dontHaveAccount')}{' '}
                      <span className="text-primary-400 font-semibold hover:text-primary-300 group-hover:underline transition-all">
                        {t('auth.signUp')}
                      </span>
                    </>
                  ) : (
                    <>
                      {t('auth.alreadyHaveAccount')}{' '}
                      <span className="text-primary-400 font-semibold hover:text-primary-300 group-hover:underline transition-all">
                        {t('auth.signIn')}
                      </span>
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Launcher Version */}
              {launcherVersion && (
                <motion.div
                  initial={shouldAnimate ? { opacity: 0 } : false}
                  animate={shouldAnimate ? { opacity: 1 } : false}
                  transition={getAnimationProps({ duration: 0.3, delay: 0.7 })}
                  className="mt-6 mb-0 pt-5 border-t border-white/5 flex items-center justify-center gap-2"
                >
                  <Info size={12} className="text-body-dim" />
                  <span className="text-xs text-body-dim font-medium">
                    Launcher v{launcherVersion}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
