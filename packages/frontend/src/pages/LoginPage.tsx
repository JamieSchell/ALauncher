/**
 * Login Page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Minus, Square, X, ChevronDown, Info } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [launcherVersion, setLauncherVersion] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await authAPI.login(username, password);
        
        if (result.success && result.accessToken && result.playerProfile) {
          setAuth(result.accessToken, result.playerProfile, result.role || 'USER');
          navigate('/');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        const result = await authAPI.register(username, password, email);
        if (result.success) {
          setMode('login');
          setError('');
          // Show success message
          alert('Registration successful! Please login.');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred');
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
      }
    };
    
    // Get version immediately
    getVersion();
    
    // Refresh version periodically
    const interval = setInterval(() => {
      getVersion();
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative window-drag">
      {/* Window controls in top-right corner */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50 window-no-drag">
        <button
          onClick={handleMinimize}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Minimize"
        >
          <Minus size={18} className="text-white" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Maximize"
        >
          <Square size={16} className="text-white" />
        </button>
        <button
          onClick={handleMinimizeToTray}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Minimize to Tray"
        >
          <ChevronDown size={18} className="text-white" />
        </button>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-red-600/80 rounded-lg transition-colors"
          title="Close"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 window-no-drag"
      >
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">ML</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-center text-gray-400 mb-8">
            {mode === 'login' ? 'Login to launch Minecraft' : 'Register a new account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="your@email.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                  <span>{mode === 'login' ? 'Login' : 'Register'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>

          {/* Launcher Version */}
          {launcherVersion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2"
            >
              <Info size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">
                Launcher v{launcherVersion}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
