/**
 * User Profile Page - Premium Design 2025
 * Senior UX/UI Designer Implementation
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Upload, 
  Save, 
  Eye, 
  EyeOff, 
  Loader2,
  Image as ImageIcon,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Clock3,
  Activity
} from 'lucide-react';
import { usersAPI, UserProfile } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import SkinViewer3D from '../components/SkinViewer3D';
import PlayerHead from '../components/PlayerHead';
import { useTranslation } from '../hooks/useTranslation';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';
import { API_CONFIG } from '../config/api';

// Helper function to get base URL for static files
const getBaseUrl = () => {
  return API_CONFIG.baseUrlWithoutApi;
};

// Helper function to get full URL for texture
const getTextureUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getBaseUrl()}${url}`;
};

export default function ProfilePage() {
  const { playerProfile, setAuth, accessToken } = useAuthStore();
  const { t } = useTranslation();
  const { getAnimationProps, shouldAnimate } = useOptimizedAnimation();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [skinFile, setSkinFile] = useState<File | null>(null);
  const [cloakFile, setCloakFile] = useState<File | null>(null);
  const skinInputRef = React.useRef<HTMLInputElement>(null);
  const cloakInputRef = React.useRef<HTMLInputElement>(null);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['userProfile'],
    queryFn: usersAPI.getProfile,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleUpdateEmail = async () => {
    if (!profile) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const result = await usersAPI.updateProfile({ email: email || undefined });
      if (result.success) {
        setMessage({ type: 'success', text: t('profile.emailUpdated') });
        // Update auth store
        if (playerProfile && accessToken) {
          setAuth(accessToken, { ...playerProfile, email: result.data!.email || undefined } as any, profile.role);
        }
        await refetch();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || t('profile.updateEmailError') 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('profile.passwordMismatch') });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('profile.passwordTooShort') });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      const result = await usersAPI.changePassword({
        currentPassword,
        newPassword,
      });
      
      if (result.success) {
        setMessage({ type: 'success', text: t('profile.passwordChanged') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || t('profile.changePasswordError') 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSkin = async () => {
    if (!skinFile) return;

    // Validate file type
    if (!skinFile.type.includes('image/png')) {
      setMessage({ type: 'error', text: t('profile.skinInvalidType') });
      return;
    }

    // Validate file size (2MB max)
    if (skinFile.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('profile.skinInvalidSize') });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      const result = await usersAPI.uploadSkin(skinFile, playerProfile?.username);
      if (result.success) {
        setMessage({ type: 'success', text: t('profile.skinUploaded') });
        // Update auth store
        if (playerProfile && accessToken) {
          setAuth(accessToken, { ...playerProfile, skinUrl: result.data!.skinUrl || undefined } as any, profile!.role);
        }
        setSkinFile(null);
        await refetch();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || t('profile.skinUploadError') 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCloak = async () => {
    if (!cloakFile) return;

    // Validate file type - PNG or GIF for cloaks
    const isValidType = cloakFile.type.includes('image/png') || cloakFile.type.includes('image/gif');
    const isValidExtension = cloakFile.name.toLowerCase().endsWith('.png') || cloakFile.name.toLowerCase().endsWith('.gif');
    
    if (!isValidType && !isValidExtension) {
      setMessage({ type: 'error', text: t('profile.cloakInvalidType') });
      return;
    }

    // Validate file size (5MB max for cloaks, including animated GIFs)
    if (cloakFile.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('profile.cloakInvalidSize') });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      const result = await usersAPI.uploadCloak(cloakFile, playerProfile?.username);
      if (result.success) {
        setMessage({ type: 'success', text: t('profile.cloakUploaded') });
        // Update auth store
        if (playerProfile && accessToken) {
          setAuth(accessToken, { ...playerProfile, cloakUrl: result.data!.cloakUrl || undefined } as any, profile!.role);
        }
        setCloakFile(null);
        await refetch();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || t('profile.cloakUploadError') 
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={shouldAnimate ? { rotate: 360 } : false}
          transition={shouldAnimate ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <Loader2 className="w-8 h-8 text-primary-400" />
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
          transition={getAnimationProps({ duration: 0.3 })}
          className="text-center"
        >
          <XCircle className="w-16 h-16 text-error-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-heading mb-2">{t('errors.userNotFound')}</h2>
          <p className="text-body-muted">{t('errors.unknownError')}</p>
        </motion.div>
      </div>
    );
  }

  const { formatDate, formatDateTime } = useFormatDate();
  const joinedDate = formatDate(profile.createdAt);
  const lastLoginDisplay = profile.lastLogin
    ? formatDateTime(profile.lastLogin)
    : t('profile.lastLoginNever');
  const accountAgeDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  const roleLabel = profile.role === 'ADMIN' ? t('profile.roleAdmin') : t('profile.roleUser');
  const statusLabel = profile.banned ? t('profile.statusBanned') : t('profile.statusActive');

  const heroStats = [
    {
      label: t('profile.joinedLabel'),
      value: joinedDate,
      icon: Calendar,
    },
    {
      label: t('profile.lastLoginLabel'),
      value: lastLoginDisplay,
      icon: Clock3,
    },
    {
      label: t('profile.accountAgeLabel'),
      value: `${accountAgeDays} ${t('profile.daysSuffix')}`,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-xl" style={{ paddingBottom: '32px' }}>
      {/* Hero Section - Premium Design */}
      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.3 })}
        className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-8 lg:p-10 border border-white/10 shadow-lg backdrop-blur-sm"
        style={{ marginBottom: '48px' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
        
        <div className="relative z-10 space-y-8 lg:space-y-10">
          {/* Player Head & Info */}
          <div className="flex items-center gap-6 lg:gap-8">
            <motion.div
              initial={shouldAnimate ? { scale: 0, rotate: -180 } : false}
              animate={shouldAnimate ? { scale: 1, rotate: 0 } : false}
              transition={getAnimationProps({ duration: 0.5, delay: 0.1 })}
              className="w-32 h-32 lg:w-36 lg:h-36 rounded-3xl bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 border border-white/15 flex items-center justify-center shadow-xl shadow-primary-500/20"
            >
              <PlayerHead
                skinUrl={getTextureUrl(profile.skinUrl)}
                username={profile.username}
                size={96}
                className="rounded-2xl border border-white/10"
              />
            </motion.div>
            <div className="space-y-3 lg:space-y-4">
              <motion.span
                initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                transition={getAnimationProps({ duration: 0.3, delay: 0.2 })}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.3em] text-body-subtle border border-white/20 bg-surface-base/50"
              >
                <Shield size={14} className="text-primary-400" />
                {t('profile.heroTag')}
              </motion.span>
              <div>
                <motion.h1
                  initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                  animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                  transition={getAnimationProps({ duration: 0.4, delay: 0.3 })}
                  className="text-4xl lg:text-5xl font-black text-heading leading-tight tracking-tight"
                >
                  {t('profile.pageTitle')}
                </motion.h1>
                <motion.p
                  initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                  animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
                  transition={getAnimationProps({ duration: 0.4, delay: 0.4 })}
                  className="text-body-muted text-lg lg:text-xl leading-relaxed mt-2"
                >
                  {t('profile.pageSubtitle')}
                </motion.p>
              </div>
              <div className="flex flex-wrap gap-3">
                <motion.span
                  initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
                  transition={getAnimationProps({ duration: 0.3, delay: 0.5 })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-gradient-to-br from-primary-500/20 to-primary-600/15 text-heading text-sm font-semibold shadow-sm shadow-primary-500/10"
                >
                  <User size={16} className="text-primary-400" />
                  {roleLabel}
                </motion.span>
                <motion.span
                  initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
                  transition={getAnimationProps({ duration: 0.3, delay: 0.6 })}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
                    profile.banned
                      ? 'text-error-400 border-error-500/40 bg-error-500/10'
                      : 'text-success-400 border-success-500/30 bg-success-500/10'
                  }`}
                >
                  {statusLabel}
                </motion.span>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '24px', rowGap: '24px', columnGap: '24px' }}>
            {heroStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
                  transition={getAnimationProps({ duration: 0.3, delay: 0.7 + index * 0.1 })}
                  whileHover={shouldAnimate ? { y: -4, scale: 1.02 } : undefined}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 p-6 backdrop-blur hover:border-primary-500/30 transition-all duration-300 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center gap-4">
                    <motion.div
                      className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                      whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
                    >
                      <Icon size={20} className="text-primary-400" strokeWidth={2.5} />
                    </motion.div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-body-subtle font-semibold mb-1">{stat.label}</p>
                      <p className="text-heading font-bold text-lg">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Email & UUID Info */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-base lg:gap-lg pt-8 lg:pt-10 border-t border-white/10" style={{ marginTop: '32px' }}>
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            transition={getAnimationProps({ duration: 0.3, delay: 0.7 })}
            className="flex items-center gap-4"
          >
            <motion.div
              className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
              whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
            >
              <Mail size={20} className="text-primary-400" strokeWidth={2.5} />
            </motion.div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-body-subtle font-semibold mb-1">{t('profile.emailSectionTitle')}</p>
              <p className="text-heading font-semibold">{profile.email || t('profile.emailStatusMissing')}</p>
            </div>
          </motion.div>
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            transition={getAnimationProps({ duration: 0.3, delay: 0.8 })}
            className="flex items-center gap-4"
          >
            <motion.div
              className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
              whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
            >
              <User size={20} className="text-primary-400" strokeWidth={2.5} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-body-subtle font-semibold mb-1">UUID</p>
              <p className="text-heading font-semibold break-all text-sm">{profile.uuid}</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Message Toast */}
      {message && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          exit={shouldAnimate ? { opacity: 0, y: -10 } : false}
          transition={getAnimationProps({ duration: 0.2 })}
          className={`rounded-2xl border px-6 py-4 flex items-center gap-3 shadow-lg ${
            message.type === 'success'
              ? 'border-success-border bg-success-bg text-success-400'
              : 'border-error-border bg-error-bg text-error-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} className="flex-shrink-0" strokeWidth={2.5} />
          ) : (
            <XCircle size={20} className="flex-shrink-0" strokeWidth={2.5} />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </motion.div>
      )}

      {/* Email & Password Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: '32px', rowGap: '32px', columnGap: '32px' }}>
        {/* Email Section */}
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          transition={getAnimationProps({ duration: 0.3, delay: 0.1 })}
          className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
          style={{ marginBottom: '32px' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
              >
                <Mail size={22} className="text-primary-400" strokeWidth={2.5} />
              </motion.div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-body-subtle font-semibold">{t('profile.emailSectionTitle')}</p>
                <h2 className="text-2xl font-bold text-heading leading-tight mt-1">{t('profile.contactHeading')}</h2>
                <p className="text-body-muted text-sm mt-1">{t('profile.emailSectionDescription')}</p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-heading">
                {t('profile.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-surface-base/80 border border-white/10 rounded-xl text-heading placeholder-text-body-subtle focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200"
                placeholder={t('profile.emailPlaceholder')}
              />
              <p className="text-xs text-body-dim">{t('profile.emailHint')}</p>
            </div>
            <motion.button
              onClick={handleUpdateEmail}
              disabled={saving || email === (profile.email || '')}
              whileHover={shouldAnimate && !saving && email !== (profile.email || '') ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate && !saving && email !== (profile.email || '') ? { scale: 0.98 } : undefined}
              className="w-full justify-center px-6 lg:px-8 py-4 lg:py-5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-600 text-white font-bold rounded-xl hover:from-primary-600 hover:via-primary-700 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-lg shadow-primary-500/30 border border-primary-500/40"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{t('profile.saving')}</span>
                </>
              ) : (
                <>
                  <Save size={20} strokeWidth={2.5} />
                  <span>{t('profile.saveEmail')}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.section>

        {/* Password Section */}
        <motion.section
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
          transition={getAnimationProps({ duration: 0.3, delay: 0.2 })}
          className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
          style={{ marginBottom: '32px' }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
                whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
              >
                <Lock size={22} className="text-primary-400" strokeWidth={2.5} />
              </motion.div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-body-subtle font-semibold">{t('profile.passwordSectionTitle')}</p>
                <h2 className="text-2xl font-bold text-heading leading-tight mt-1">{t('profile.securityHeadline')}</h2>
                <p className="text-body-muted text-sm mt-1">{t('profile.passwordHint')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-heading mb-2">
                  {t('profile.currentPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-surface-base/80 border border-white/10 rounded-xl text-heading placeholder-text-body-subtle focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200 pr-12"
                    placeholder={t('profile.currentPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-heading mb-2">
                    {t('profile.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-surface-base/80 border border-white/10 rounded-xl text-heading placeholder-text-body-subtle focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200 pr-12"
                      placeholder={t('profile.newPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-heading mb-2">
                    {t('profile.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-surface-base/80 border border-white/10 rounded-xl text-heading placeholder-text-body-subtle focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200 pr-12"
                      placeholder={t('profile.confirmPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-body-muted hover:text-heading transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              whileHover={shouldAnimate && !saving && currentPassword && newPassword && confirmPassword ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate && !saving && currentPassword && newPassword && confirmPassword ? { scale: 0.98 } : undefined}
              className="w-full justify-center px-6 lg:px-8 py-4 lg:py-5 bg-gradient-to-r from-success-500 via-success-600 to-success-600 text-white font-bold rounded-xl hover:from-success-600 hover:via-success-700 hover:to-success-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-lg shadow-success-500/30 border border-success-500/40"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>{t('profile.changing')}</span>
                </>
              ) : (
                <>
                  <Lock size={20} strokeWidth={2.5} />
                  <span>{t('profile.changePasswordButton')}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.section>
      </div>

      {/* Textures Section */}
      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.3, delay: 0.3 })}
        className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
        
        <div className="relative z-10 space-y-6 lg:space-y-8">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
              whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
            >
              <ImageIcon size={22} className="text-primary-400" strokeWidth={2.5} />
            </motion.div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-body-subtle font-semibold">{t('profile.texturesSectionTitle')}</p>
              <h2 className="text-2xl font-bold text-heading leading-tight mt-1">{t('profile.appearanceHeadline')}</h2>
              <p className="text-body-muted text-sm mt-1">{t('profile.texturesSubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '32px', rowGap: '32px', columnGap: '32px' }}>
            {/* Skin Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 p-6 backdrop-blur space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-heading">{t('profile.skinCardTitle')}</h3>
                <span className="text-xs uppercase tracking-[0.3em] text-body-subtle font-semibold">{t('profile.skin')}</span>
              </div>
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="w-full md:w-60 h-60 bg-surface-base/80 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                  {profile.skinUrl ? (
                    <SkinViewer3D
                      skinUrl={getTextureUrl(profile.skinUrl)}
                      cloakUrl={null}
                      width={220}
                      height={220}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-body-dim space-y-3">
                      <ImageIcon size={48} className="mx-auto opacity-50" strokeWidth={1.5} />
                      <p className="text-sm font-medium">{t('profile.noSkin')}</p>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-heading mb-2">
                      {t('profile.skinUploadLabel')}
                    </label>
                    <div className="relative">
                      <input
                        ref={skinInputRef}
                        type="file"
                        accept="image/png"
                        onChange={(e) => setSkinFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        aria-label={t('profile.skinUploadLabel')}
                        title={t('profile.skinUploadLabel')}
                      />
                      <div className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-surface-base/80 border border-white/10 rounded-xl text-heading focus-within:border-primary-500 focus-within:bg-surface-elevated/90 transition-all duration-200 flex items-center justify-between">
                        <span className="text-sm text-body-muted">
                          {skinFile ? skinFile.name : t('profile.noFileChosen')}
                        </span>
                        <motion.button
                          type="button"
                          onClick={() => skinInputRef.current?.click()}
                          whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-sm shadow-primary-500/20 border border-primary-500/40"
                        >
                          {t('profile.chooseFile')}
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-xs text-body-dim mt-2">{t('profile.skinUploadHint')}</p>
                  </div>
                  {skinFile && (
                    <motion.button
                      onClick={handleUploadSkin}
                      disabled={saving}
                      whileHover={shouldAnimate && !saving ? { scale: 1.02 } : undefined}
                      whileTap={shouldAnimate && !saving ? { scale: 0.98 } : undefined}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 border border-primary-500/40"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} strokeWidth={2.5} />}
                      <span>{saving ? t('profile.uploading') : t('profile.skinUploadCta')}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Cloak Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 p-6 backdrop-blur space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-heading">{t('profile.cloakCardTitle')}</h3>
                <span className="text-xs uppercase tracking-[0.3em] text-body-subtle font-semibold">{t('profile.cloak')}</span>
              </div>
              <div className="flex flex-col gap-5 md:flex-row">
                <div className="w-full md:w-60 h-60 bg-surface-base/80 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                  {profile.skinUrl ? (
                    <SkinViewer3D
                      skinUrl={getTextureUrl(profile.skinUrl)}
                      cloakUrl={getTextureUrl(profile.cloakUrl)}
                      width={220}
                      height={220}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-body-dim space-y-3">
                      <ImageIcon size={48} className="mx-auto opacity-50" strokeWidth={1.5} />
                      <p className="text-sm font-medium">{t('profile.uploadSkinFirst')}</p>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-heading mb-2">
                      {t('profile.cloakUploadLabel')}
                    </label>
                    <div className="relative">
                      <input
                        ref={cloakInputRef}
                        type="file"
                        accept="image/png,image/gif"
                        onChange={(e) => setCloakFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        aria-label={t('profile.cloakUploadLabel')}
                        title={t('profile.cloakUploadLabel')}
                      />
                      <div className="w-full px-4 lg:px-6 py-3 lg:py-4 bg-surface-base/80 border border-white/10 rounded-xl text-heading focus-within:border-primary-500 focus-within:bg-surface-elevated/90 transition-all duration-200 flex items-center justify-between">
                        <span className="text-sm text-body-muted">
                          {cloakFile ? cloakFile.name : t('profile.noFileChosen')}
                        </span>
                        <motion.button
                          type="button"
                          onClick={() => cloakInputRef.current?.click()}
                          whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-sm shadow-primary-500/20 border border-primary-500/40"
                        >
                          {t('profile.chooseFile')}
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-xs text-body-dim mt-2">{t('profile.cloakUploadHint')}</p>
                  </div>
                  {cloakFile && (
                    <motion.button
                      onClick={handleUploadCloak}
                      disabled={saving}
                      whileHover={shouldAnimate && !saving ? { scale: 1.02 } : undefined}
                      whileTap={shouldAnimate && !saving ? { scale: 0.98 } : undefined}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 border border-primary-500/40"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} strokeWidth={2.5} />}
                      <span>{saving ? t('profile.uploading') : t('profile.cloakUploadCta')}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
