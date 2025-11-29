/**
 * User Profile Page
 * Просмотр и редактирование профиля пользователя
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
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400">Unable to load your profile.</p>
        </div>
      </div>
    );
  }

  const joinedDate = new Date(profile.createdAt).toLocaleDateString();
  const lastLoginDisplay = profile.lastLogin
    ? new Date(profile.lastLogin).toLocaleString()
    : t('profile.lastLoginNever');
  const accountAgeDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  const roleLabel = profile.role === 'ADMIN' ? t('profile.roleAdmin') : t('profile.roleUser');
  const statusLabel = profile.banned ? t('profile.statusBanned') : t('profile.statusActive');
  const statusBadgeClass = profile.banned
    ? 'text-red-300 border-red-500/40 bg-red-500/10'
    : 'text-green-300 border-green-500/30 bg-green-500/10';

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
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1f1f1f] via-[#151515] to-[#0c0c0c] border border-[#2f2f2f] p-8 space-y-8"
      >
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center shadow-xl shadow-black/40">
              <PlayerHead
                skinUrl={getTextureUrl(profile.skinUrl)}
                username={profile.username}
                size={96}
                className="rounded-2xl border border-white/5"
              />
            </div>
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-[0.3em] text-white/70 border border-white/20">
                <Shield size={14} className="text-[#7fb640]" />
                {t('profile.heroTag')}
              </span>
              <div>
                <h1 className="text-4xl font-black text-white leading-tight">{t('profile.pageTitle')}</h1>
                <p className="text-gray-400 mt-1 text-sm">{t('profile.pageSubtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl border border-white/15 bg-white/5 text-white text-sm">
                  <User size={16} className="text-[#7fb640]" />
                  {roleLabel}
                </span>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-sm ${statusBadgeClass}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            {heroStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#1f1f1f] border border-white/10 text-[#7fb640]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{stat.label}</p>
                      <p className="text-white font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-200">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-[#9ec75b]" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{t('profile.emailSectionTitle')}</p>
              <p className="text-white">{profile.email || t('profile.emailStatusMissing')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User size={18} className="text-[#9ec75b]" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{t('profile.uuidLabel')}</p>
              <p className="text-white break-all">{profile.uuid}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
            message.type === 'success'
              ? 'border-green-500/40 bg-green-500/10 text-green-200'
              : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="text-sm">{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#1b1b1b]/90 border border-[#2f2f2f] p-6 space-y-5"
        >
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">{t('profile.emailSectionTitle')}</p>
            <h2 className="text-2xl font-bold text-white mt-1">{t('profile.contactHeading')}</h2>
            <p className="text-gray-400 text-sm">{t('profile.emailSectionDescription')}</p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              {t('profile.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#111111] border border-[#2f2f2f] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7fb640]"
              placeholder={t('profile.emailPlaceholder')}
            />
            <p className="text-xs text-gray-500">{t('profile.emailHint')}</p>
          </div>
          <button
            onClick={handleUpdateEmail}
            disabled={saving || email === (profile.email || '')}
            className="w-full justify-center px-6 py-3 bg-gradient-to-r from-[#7fb640] to-[#4f7c1c] hover:from-[#8ed14a] hover:to-[#5c9124] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>{t('profile.saving')}</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>{t('profile.saveEmail')}</span>
              </>
            )}
          </button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#1b1b1b]/90 border border-[#2f2f2f] p-6 space-y-5"
        >
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">{t('profile.passwordSectionTitle')}</p>
            <h2 className="text-2xl font-bold text-white mt-1">{t('profile.securityHeadline')}</h2>
            <p className="text-gray-400 text-sm">{t('profile.passwordHint')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('profile.currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-[#2f2f2f] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7fb640] pr-12"
                  placeholder={t('profile.currentPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('profile.newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111111] border border-[#2f2f2f] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7fb640] pr-12"
                    placeholder={t('profile.newPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('profile.confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111111] border border-[#2f2f2f] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7fb640] pr-12"
                    placeholder={t('profile.confirmPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full justify-center px-6 py-3 bg-gradient-to-r from-[#283618] to-[#1b3010] hover:brightness-110 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>{t('profile.changing')}</span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>{t('profile.changePasswordButton')}</span>
              </>
            )}
          </button>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-[#1b1b1b]/90 border border-[#2f2f2f] p-6 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">{t('profile.texturesSectionTitle')}</p>
            <h2 className="text-2xl font-bold text-white">{t('profile.appearanceHeadline')}</h2>
            <p className="text-gray-400 text-sm">{t('profile.texturesSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{t('profile.skinCardTitle')}</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-gray-500">{t('profile.skin') }</span>
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="w-full md:w-60 h-60 bg-[#111]/80 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                {profile.skinUrl ? (
                  <SkinViewer3D
                    skinUrl={getTextureUrl(profile.skinUrl)}
                    cloakUrl={null}
                    width={220}
                    height={220}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="text-center text-gray-500 text-sm space-y-2">
                    <ImageIcon size={40} className="mx-auto opacity-50" />
                    <p>{t('profile.noSkin')}</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('profile.skinUploadLabel')}
                  </label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => setSkinFile(e.target.files?.[0] || null)}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#7fb640] file:text-black file:font-semibold file:cursor-pointer text-white bg-[#111] border border-[#2f2f2f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fb640]"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('profile.skinUploadHint')}</p>
                </div>
                {skinFile && (
                  <button
                    onClick={handleUploadSkin}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#7fb640] hover:bg-[#8ed14a] text-black font-semibold rounded-xl transition-colors disabled:bg-gray-600 disabled:text-gray-200"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    <span>{saving ? t('profile.uploading') : t('profile.skinUploadCta')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{t('profile.cloakCardTitle')}</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-gray-500">{t('profile.cloak')}</span>
            </div>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="w-full md:w-60 h-60 bg-[#111]/80 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                {profile.skinUrl ? (
                  <SkinViewer3D
                    skinUrl={getTextureUrl(profile.skinUrl)}
                    cloakUrl={getTextureUrl(profile.cloakUrl)}
                    width={220}
                    height={220}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="text-center text-gray-500 text-sm space-y-2">
                    <ImageIcon size={40} className="mx-auto opacity-50" />
                    <p>{t('profile.uploadSkinFirst')}</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('profile.cloakUploadLabel')}
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/gif"
                    onChange={(e) => setCloakFile(e.target.files?.[0] || null)}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#7fb640] file:text-black file:font-semibold file:cursor-pointer text-white bg-[#111] border border-[#2f2f2f] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7fb640]"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('profile.cloakUploadHint')}</p>
                </div>
                {cloakFile && (
                  <button
                    onClick={handleUploadCloak}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#7fb640] hover:bg-[#8ed14a] text-black font-semibold rounded-xl transition-colors disabled:bg-gray-600 disabled:text-gray-200"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    <span>{saving ? t('profile.uploading') : t('profile.cloakUploadCta')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

