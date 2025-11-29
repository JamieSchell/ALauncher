/**
 * Login Page - Professional Design
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
  CheckCircle2,
  AlertCircle,
  Gamepad2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../api/auth';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toasts, showInfo, showError, showSuccess, removeToast } = useToast();
  const { t } = useTranslation();
  
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
    <div className="flex items-center justify-center min-h-screen relative window-drag overflow-hidden bg-[#1a1a1a]">
      {/* Minecraft-inspired Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d2d2d] via-[#1f1f1f] to-[#0f0f0f]">
        {/* Subtle texture overlay - reminiscent of blocks */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        
        {/* Subtle ambient lighting - earthy tones */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#3d5a3d]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#5d4a2d]/5 rounded-full blur-[100px]" />
        
        {/* Subtle grid pattern - block-like */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,139,139,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,139,139,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Window controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50 window-no-drag">
        <LanguageSwitcher />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMinimize}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
          title="Minimize"
        >
          <Minus size={18} className="text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMaximize}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
          title="Maximize"
        >
          <Square size={16} className="text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMinimizeToTray}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
          title="Minimize to Tray"
        >
          <ChevronDown size={18} className="text-white" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="p-2 hover:bg-red-500/80 rounded-lg transition-colors backdrop-blur-sm"
          title="Close"
        >
          <X size={18} className="text-white" />
        </motion.button>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 window-no-drag relative z-10"
      >
        <motion.div
          className="relative backdrop-blur-sm bg-[#2a2a2a]/80 rounded-2xl p-8 shadow-2xl border border-[#3d3d3d]/50 overflow-hidden"
          whileHover={{ borderColor: 'rgba(107, 142, 35, 0.4)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle inner shadow */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none" />
          
          {/* Logo/Icon - Minecraft-inspired */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#6b8e23]/20 rounded-xl blur-lg" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#6b8e23] to-[#556b2f] rounded-xl flex items-center justify-center shadow-lg border border-[#7a9f35]/30">
                <Gamepad2 className="text-white" size={28} />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-3xl font-bold mb-2 text-white"
              >
                {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
              </motion.h1>
            </AnimatePresence>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-sm"
            >
              {mode === 'login' ? t('auth.signInToContinue') : t('auth.joinUs')}
            </motion.p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <User size={16} />
                {t('auth.username')}
              </label>
              <div className="relative">
                <input
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
                  className={`w-full pl-12 pr-4 py-3.5 bg-[#1f1f1f] border rounded-lg text-white placeholder-gray-500 
                    focus:outline-none focus:ring-2 focus:ring-[#6b8e23]/50 focus:border-[#6b8e23]/50 
                    transition-all ${
                    usernameError ? 'border-red-500/50' : 'border-[#3d3d3d]'
                  }`}
                  placeholder={t('auth.username')}
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              </div>
            </motion.div>

            {/* Email (Register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <input
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
                      className={`w-full pl-12 pr-4 py-3.5 bg-[#1f1f1f] border rounded-lg text-white placeholder-gray-500 
                        focus:outline-none focus:ring-2 focus:ring-[#6b8e23]/50 focus:border-[#6b8e23]/50 
                        transition-all ${
                        emailError ? 'border-red-500/50' : 'border-[#3d3d3d]'
                      }`}
                      placeholder="your@email.com"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: mode === 'register' ? 0.6 : 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Lock size={16} />
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
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
                  className={`w-full pl-12 pr-12 py-3.5 bg-[#1f1f1f] border rounded-lg text-white placeholder-gray-500 
                    focus:outline-none focus:ring-2 focus:ring-[#6b8e23]/50 focus:border-[#6b8e23]/50 
                    transition-all ${
                    passwordError ? 'border-red-500/50' : 'border-[#3d3d3d]'
                  }`}
                  placeholder={t('auth.password')}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !!usernameError || !!passwordError || (mode === 'register' && (!!emailError || !email))}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full px-6 py-3.5 bg-gradient-to-b from-[#6b8e23] to-[#556b2f] 
                text-white font-semibold rounded-lg hover:from-[#7a9f35] hover:to-[#6b8e23] 
                focus:outline-none focus:ring-2 focus:ring-[#6b8e23]/50 transition-all 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 
                shadow-lg shadow-[#6b8e23]/20 border border-[#7a9f35]/30 relative overflow-hidden group"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Lock size={18} />
                  </motion.div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                  <span>{mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Mode Switch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
                setUsernameError('');
                setPasswordError('');
                setEmailError('');
              }}
              className="text-sm text-gray-400 hover:text-[#6b8e23] transition-colors group"
            >
                  {mode === 'login' ? (
                    <>
                      {t('auth.dontHaveAccount')}{' '}
                      <span className="text-[#6b8e23] group-hover:text-[#7a9f35] font-medium">{t('auth.signUp')}</span>
                    </>
                  ) : (
                    <>
                      {t('auth.alreadyHaveAccount')}{' '}
                      <span className="text-[#6b8e23] group-hover:text-[#7a9f35] font-medium">{t('auth.signIn')}</span>
                    </>
                  )}
            </button>
          </motion.div>

          {/* Launcher Version */}
          {launcherVersion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 pt-6 border-t border-[#3d3d3d] flex items-center justify-center gap-2"
            >
              <Info size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">
                Launcher v{launcherVersion}
              </span>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
