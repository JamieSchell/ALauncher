/**
 * Cyberpunk Login Page - Full Design from /desing
 * Techno-Magic Design System
 *
 * С обновлённым функционалом автосохранения логина и пароля
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Lock, Fingerprint, Hexagon, ScanLine, Minus, Square, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../api/auth';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { useTranslation } from '../hooks/useTranslation';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { usernameSchema, passwordSchema, validateInput } from '../utils/validation';
import { tauriApi, isTauri } from '../api/tauri';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, loadCredentials, saveCredentials, clearCredentials } = useAuthStore();
  const { toasts, showError, showSuccess, removeToast } = useToast();
  const { t } = useTranslation();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [stage, setStage] = useState<'IDLE' | 'SCANNING' | 'GRANTED' | 'ERROR'>('IDLE');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Generate unique IDs for form fields
  const usernameId = 'login-username';
  const passwordId = 'login-password';

  /**
   * Загрузка сохранённых кредов при монтировании компонента
   */
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const creds = await loadCredentials();
        if (creds) {
          setUsername(creds.username);
          setPassword(creds.password);
          setRememberMe(creds.rememberMe);
          console.log('[LoginPage] Auto-filled credentials from Tauri Store');
        }
      } catch (error) {
        console.error('[LoginPage] Failed to load credentials:', error);
      }
    };

    loadSavedCredentials();
  }, [loadCredentials]);

  const validateUsername = (value: string): boolean => {
    const result = validateInput(usernameSchema, value);
    if (!result.success) {
      setUsernameError(result.errors.username || result.errors[''] || 'Invalid username');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validatePassword = (value: string): boolean => {
    const result = validateInput(passwordSchema, value);
    if (!result.success) {
      setPasswordError(result.errors.password || result.errors[''] || 'Invalid password');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    setError('');
    setSuccess('');

    const isUsernameValid = validateUsername(username);
    const isPasswordValid = validatePassword(password);

    if (!isUsernameValid || !isPasswordValid) {
      return;
    }

    setStage('SCANNING');
    setLoading(true);

    try {
      const result = await authAPI.login(username, password);

      // Simulate scanning effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (result.success && result.accessToken && result.playerProfile) {
        setStage('GRANTED');
        setAuth(result.accessToken, result.playerProfile, result.role || 'USER');

        // Сохраняем логин и пароль (если включён "Запомнить меня")
        if (rememberMe) {
          await saveCredentials({ username, password, rememberMe });
          console.log('[LoginPage] Credentials saved to Tauri Store');
        } else {
          // Очищаем старые креды если checkbox выключен
          await clearCredentials();
        }

        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setStage('ERROR');
        setError(result.error || 'Login failed. Please check your credentials.');
        showError(result.error || 'Login failed');
        setTimeout(() => setStage('IDLE'), 2000);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setStage('ERROR');
      const errorMessage = error.message || 'An unexpected error occurred';
      setError(errorMessage);
      showError(errorMessage);
      setTimeout(() => setStage('IDLE'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      await tauriApi.minimizeWindow();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    if (!isTauri) return;
    try {
      await tauriApi.maximizeWindow();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      await tauriApi.closeWindow();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-dark-primary relative overflow-hidden font-mono text-white">
      {/* Window Title Bar */}
      <header
        data-tauri-drag-region
        className="h-14 flex items-center justify-between px-6 z-50 select-none bg-dark-secondary/80 backdrop-blur-md border-b border-white/10"
      >
        <div className="flex items-center gap-3" data-tauri-drag-region>
          <div className="flex space-x-1">
            <div className="w-1 h-6 bg-techno-cyan animate-pulse" />
            <div className="w-1 h-4 bg-magic-purple mt-2" />
            <div className="w-1 h-5 bg-white/50 mt-1" />
          </div>
          <span className="font-display font-bold tracking-[0.2em] text-sm text-white">
            || ALAUNCHER <span className="text-techno-cyan">OS</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isTauri && (
            <>
              <button
                onClick={handleMinimize}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white border border-white/20 hover:border-white/40 transition-all duration-200 rounded"
                type="button"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleMaximize}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white border border-white/20 hover:border-white/40 transition-all duration-200 rounded"
                type="button"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-status-error hover:text-white text-white border border-white/20 hover:border-status-error transition-all duration-200 rounded"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Immersive Background */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-cyber-grid" />
        <div className="absolute inset-0 scanlines opacity-20" />

        {/* Rotating Runes/Rings */}
        <div className="absolute w-[800px] h-[800px] border border-white/5 rounded-full animate-spin-slow opacity-20" style={{ borderStyle: 'dashed' }} />
        <div className="absolute w-[600px] h-[600px] border border-techno-cyan/10 rounded-full animate-spin-slow opacity-30 animation-direction-reverse" style={{ animationDuration: '20s' }} />

        {/* Main Terminal Container */}
        <div className="relative z-10 w-full max-w-lg px-4">
          <div className="bg-dark-panel/90 backdrop-blur-xl border border-white/10 clip-cyber-corner p-1 shadow-2xl">
            {/* Inner Content */}
            <div className="bg-dark-primary clip-cyber-corner p-8 relative overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Hexagon className="w-8 h-8 text-techno-cyan animate-pulse" />
                  <div>
                    <h1 className="text-sm font-display font-bold tracking-widest">
                      GATEWAY<span className="text-techno-cyan">_01</span>
                    </h1>
                    <div className="text-[10px] text-gray-500">SECURE CONNECTION REQUIRED</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white">SYSTEM LOCKED</div>
                  <div className="text-[10px] text-gray-600">v2.0</div>
                </div>
              </div>

              {/* Login Form */}
              {stage === 'IDLE' && (
                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
                  {error && (
                    <div className="p-4 border border-status-error/30 bg-status-error/5 clip-cyber-corner flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-status-error rounded-full animate-pulse" />
                      <span className="text-xs text-status-error">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-4 border border-status-success/30 bg-status-success/5 clip-cyber-corner flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
                      <span className="text-xs text-status-success">{success}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Input
                      id={usernameId}
                      name="username"
                      type="text"
                      autoComplete="username"
                      label="NEURAL LINK ID *"
                      placeholder="R-77334-X"
                      leftIcon={<Fingerprint className="w-5 h-5" />}
                      required
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setUsernameError('');
                      }}
                      onBlur={(e) => validateUsername(e.target.value)}
                      error={usernameError}
                      disabled={loading}
                    />
                    <Input
                      id={passwordId}
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      label="ACCESS KEY *"
                      placeholder="••••••••••••"
                      leftIcon={<Lock className="w-5 h-5" />}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      onBlur={(e) => validatePassword(e.target.value)}
                      error={passwordError}
                      disabled={loading}
                    />

                    {/* Remember Me Checkbox */}
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-dark-secondary text-techno-cyan focus:ring-techno-cyan focus:ring-offset-dark-primary"
                      />
                      <label htmlFor="remember-me" className="text-xs text-gray-400 cursor-pointer select-none">
                        Save credentials for auto-login
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full shadow-[0_0_20px_rgba(0,245,255,0.4)]"
                      disabled={loading}
                      isLoading={loading}
                      leftIcon={!loading ? <Zap className="w-4 h-4" /> : undefined}
                    >
                      {loading ? t('login.processing') : t('login.initiateHandshake')}
                    </Button>
                  </div>

                </form>
              )}

              {/* Scanning Animation State */}
              {stage === 'SCANNING' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-4 border-techno-cyan/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 border-t-4 border-techno-cyan rounded-full animate-spin" />
                    <ScanLine className="absolute inset-0 m-auto w-12 h-12 text-techno-cyan animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white animate-pulse">VERIFYING BIOMETRICS...</h2>
                    <p className="text-xs text-techno-cyan font-mono mt-2">Analyzing neural patterns</p>
                  </div>
                  <div className="w-full h-1 bg-dark-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-techno-cyan animate-[scan_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              {/* Granted State */}
              {stage === 'GRANTED' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <Shield className="w-24 h-24 text-status-success animate-bounce" />
                  <h2 className="text-2xl font-bold text-status-success tracking-widest">ACCESS GRANTED</h2>
                  <p className="text-xs text-gray-400">Welcome back, Operator.</p>
                </div>
              )}

              {/* Error State */}
              {stage === 'ERROR' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <X className="w-24 h-24 text-status-error animate-pulse" />
                  <h2 className="text-2xl font-bold text-status-error tracking-widest">ACCESS DENIED</h2>
                  <p className="text-xs text-gray-400">{error}</p>
                </div>
              )}

              {/* Footer Decor */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-techno-cyan/50 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
