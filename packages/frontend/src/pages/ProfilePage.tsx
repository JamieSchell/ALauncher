/**
 * User Profile Page - Functionality Only
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Activity,
  Zap,
  Award,
  MessageSquare,
  User as UserIcon
} from 'lucide-react';
import { usersAPI, UserProfile } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import SkinViewer3D from '../components/SkinViewer3D';
import PlayerHead from '../components/PlayerHead';
import { useTranslation } from '../hooks/useTranslation';
import { useFormatDate } from '../hooks/useFormatDate';
import { API_CONFIG } from '../config/api';
import { Card, Button, Input, Badge } from '../components/ui';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

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
  const { formatDate, formatDateTime } = useFormatDate();

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
        <Loader2 className="w-8 h-8 text-techno-cyan animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="text-center">
          <XCircle className="w-16 h-16 text-status-error mx-auto mb-4" />
          <h2 className="text-sm font-bold mb-2">{t('errors.userNotFound')}</h2>
          <p className="text-gray-400">{t('errors.unknownError')}</p>
        </Card>
      </div>
    );
  }

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
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* Header Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden border border-techno-cyan/20 group">
        <div className="absolute inset-0 bg-gradient-to-r from-magic-purple/20 to-techno-cyan/20 z-0" />
        <div className="absolute inset-0 bg-rune-pattern opacity-30 z-0" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-dark-primary via-dark-primary/80 to-transparent z-10 flex items-end gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-techno-cyan to-magic-purple shadow-[0_0_20px_rgba(0,245,255,0.4)]">
              <PlayerHead
                skinUrl={getTextureUrl(profile.skinUrl)}
                username={profile.username}
                size={88}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-dark-panel border border-techno-cyan rounded-full p-1.5 shadow-neon-cyan">
               <Shield className="w-5 h-5 text-techno-cyan" />
            </div>
          </div>
          
          <div className="mb-2">
            <h1 className="text-base font-display font-bold text-white tracking-wider flex items-center gap-3">
              {profile.username}
              <span className="text-[10px] px-2 py-0.5 rounded border border-magic-purple text-magic-purple bg-magic-purple/10 font-mono align-middle">
                {roleLabel}
              </span>
            </h1>
            <p className="text-techno-cyan font-mono text-xs mt-1 flex items-center gap-4">
              <span>{t('profile.joinedLabel')}: {joinedDate}</span>
              <span className="text-gray-500">|</span>
              <span>ID: #{profile.uuid.slice(0, 8)}</span>
            </p>
          </div>
          
          <div className="ml-auto flex gap-3 mb-2">
            <Button variant="secondary" leftIcon={<MessageSquare className="w-4 h-4" />}>
              {t('profile.message') || 'Message'}
            </Button>
            <Button variant="primary" leftIcon={<UserIcon className="w-4 h-4" />}>
              {t('profile.editProfile') || 'Edit Profile'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-techno-cyan font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Neural Statistics
            </h3>
            <div className="h-64 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { subject: 'Combat', A: 120, fullMark: 150 },
                  { subject: 'Tech', A: 98, fullMark: 150 },
                  { subject: 'Magic', A: 86, fullMark: 150 },
                  { subject: 'Explore', A: 99, fullMark: 150 },
                  { subject: 'Social', A: 85, fullMark: 150 },
                  { subject: 'Build', A: 65, fullMark: 150 },
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="Skills"
                    dataKey="A"
                    stroke="#00F5FF"
                    strokeWidth={2}
                    fill="#00F5FF"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A2332', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '4px', color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#00F5FF' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-dark-panel p-3 rounded border border-white/5">
                <div className="text-gray-400 text-xs uppercase">Play Time</div>
                <div className="text-white font-mono text-sm font-bold flex items-center gap-2">
                  <Clock3 className="w-3 h-3 text-magic-purple" /> {accountAgeDays}d
                </div>
              </div>
              <div className="bg-dark-panel p-3 rounded border border-white/5">
                <div className="text-gray-400 text-[10px] uppercase">Rank</div>
                <div className="text-white font-mono text-sm font-bold flex items-center gap-2">
                  <Award className="w-3 h-3 text-status-warning" /> {roleLabel}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle Column: Achievements & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-magic-purple font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                <Award className="w-3 h-3" /> Recent Achievements
              </h3>
              <span className="text-[10px] text-gray-500 hover:text-white cursor-pointer transition-colors">View All</span>
            </div>
            
            <div className="space-y-4">
              {heroStats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="group flex items-center gap-4 p-3 rounded-lg bg-dark-panel border border-white/5 hover:border-techno-cyan/30 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-techno-cyan/10 text-techno-cyan">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-techno-cyan transition-colors">{stat.label}</h4>
                        <span className="text-[10px] font-mono text-gray-500">{stat.value}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 className="text-status-success font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
              <UserIcon className="w-3 h-3" /> Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded bg-dark-panel border border-white/5">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-techno-cyan" />
                  <div>
                    <div className="font-bold text-xs text-white">Email</div>
                    <div className="text-[10px] font-mono text-gray-500">{profile.email || 'Not set'}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded bg-dark-panel border border-white/5">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-techno-cyan" />
                  <div>
                    <div className="font-bold text-xs text-white">UUID</div>
                    <div className="text-[10px] font-mono text-gray-500 truncate">{profile.uuid.slice(0, 8)}...</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Old Hero Section - Keeping for compatibility */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderRadius: '24px',
        padding: '32px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '48px',
        display: 'none'
      }}>
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Player Head & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: '128px',
              height: '128px',
              borderRadius: '24px',
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlayerHead
                skinUrl={getTextureUrl(profile.skinUrl)}
                username={profile.username}
                size={96}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(17, 24, 39, 0.5)'
              }}>
                <Shield size={14} style={{ color: '#818cf8' }} />
                {t('profile.heroTag')}
              </div>
              <div>
                <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                  {t('profile.pageTitle')}
                </h1>
                <p style={{ fontSize: '18px', marginTop: '8px' }}>
                  {t('profile.pageSubtitle')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  <User size={16} style={{ color: '#818cf8' }} />
                  {roleLabel}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: profile.banned ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid rgba(74, 222, 128, 0.3)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: profile.banned ? '#f87171' : '#4ade80'
                }}>
                  {statusLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {heroStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      backgroundColor: 'rgba(99, 102, 241, 0.2)'
                    }}>
                      <Icon size={20} style={{ color: '#818cf8' }} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{stat.label}</p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email & UUID Info */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              backgroundColor: 'rgba(99, 102, 241, 0.2)'
            }}>
              <Mail size={20} style={{ color: '#818cf8' }} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{t('profile.emailSectionTitle')}</p>
              <p style={{ fontWeight: '600' }}>{profile.email || t('profile.emailStatusMissing')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              backgroundColor: 'rgba(99, 102, 241, 0.2)'
            }}>
              <User size={20} style={{ color: '#818cf8' }} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>UUID</p>
              <p style={{ fontWeight: '600', wordBreak: 'break-all', fontSize: '14px' }}>{profile.uuid}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div style={{
          borderRadius: '16px',
          border: message.type === 'success' ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          marginBottom: '32px'
        }}>
          {message.type === 'success' ? (
            <CheckCircle size={20} strokeWidth={2.5} />
          ) : (
            <XCircle size={20} strokeWidth={2.5} />
          )}
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{message.text}</span>
        </div>
      )}

      {/* Email & Password Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
        {/* Email Section */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          borderRadius: '24px',
          padding: '24px 32px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '32px'
        }}>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                backgroundColor: 'rgba(99, 102, 241, 0.2)'
              }}>
                <Mail size={22} style={{ color: '#818cf8' }} strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('profile.emailSectionTitle')}</p>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{t('profile.contactHeading')}</h2>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>{t('profile.emailSectionDescription')}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600' }}>
                {t('profile.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  outline: 'none'
                }}
                placeholder={t('profile.emailPlaceholder')}
              />
              <p style={{ fontSize: '12px' }}>{t('profile.emailHint')}</p>
            </div>
            <button
              onClick={handleUpdateEmail}
              disabled={saving || email === (profile.email || '')}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '16px 32px',
                backgroundColor: '#6366f1',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '12px',
                opacity: saving || email === (profile.email || '') ? 0.5 : 1,
                cursor: saving || email === (profile.email || '') ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: 'none'
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{t('profile.saving')}</span>
                </>
              ) : (
                <>
                  <Save size={20} strokeWidth={2.5} />
                  <span>{t('profile.saveEmail')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          borderRadius: '24px',
          padding: '24px 32px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '32px'
        }}>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                backgroundColor: 'rgba(99, 102, 241, 0.2)'
              }}>
                <Lock size={22} style={{ color: '#818cf8' }} strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('profile.passwordSectionTitle')}</p>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{t('profile.securityHeadline')}</h2>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>{t('profile.passwordHint')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  {t('profile.currentPassword')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 24px',
                      paddingRight: '48px',
                      backgroundColor: 'rgba(17, 24, 39, 0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      outline: 'none'
                    }}
                    placeholder={t('profile.currentPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {showCurrentPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    {t('profile.newPassword')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        paddingRight: '48px',
                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                      placeholder={t('profile.newPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      {showNewPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    {t('profile.confirmPassword')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 24px',
                        paddingRight: '48px',
                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        outline: 'none'
                      }}
                      placeholder={t('profile.confirmPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '16px 32px',
                backgroundColor: '#22c55e',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '12px',
                opacity: saving || !currentPassword || !newPassword || !confirmPassword ? 0.5 : 1,
                cursor: saving || !currentPassword || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: 'none'
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>{t('profile.changing')}</span>
                </>
              ) : (
                <>
                  <Lock size={20} strokeWidth={2.5} />
                  <span>{t('profile.changePasswordButton')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Textures Section */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderRadius: '24px',
        padding: '24px 32px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              backgroundColor: 'rgba(99, 102, 241, 0.2)'
            }}>
              <ImageIcon size={22} style={{ color: '#818cf8' }} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('profile.texturesSectionTitle')}</p>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{t('profile.appearanceHeadline')}</h2>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>{t('profile.texturesSubtitle')}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
            {/* Skin Card */}
            <div style={{
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{t('profile.skinCardTitle')}</h3>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('profile.skin')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ width: '100%', height: '240px', backgroundColor: 'rgba(17, 24, 39, 0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile.skinUrl ? (
                    <SkinViewer3D
                      skinUrl={getTextureUrl(profile.skinUrl)}
                      cloakUrl={null}
                      width={220}
                      height={220}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ImageIcon size={48} style={{ opacity: 0.5, margin: '0 auto' }} strokeWidth={1.5} />
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{t('profile.noSkin')}</p>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      {t('profile.skinUploadLabel')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={skinInputRef}
                        type="file"
                        accept="image/png"
                        onChange={(e) => setSkinFile(e.target.files?.[0] || null)}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                        aria-label={t('profile.skinUploadLabel')}
                        title={t('profile.skinUploadLabel')}
                      />
                      <div style={{
                        width: '100%',
                        padding: '12px 24px',
                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '14px' }}>
                          {skinFile ? skinFile.name : t('profile.noFileChosen')}
                        </span>
                        <button
                          type="button"
                          onClick={() => skinInputRef.current?.click()}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6366f1',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {t('profile.chooseFile')}
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>{t('profile.skinUploadHint')}</p>
                  </div>
                  {skinFile && (
                    <button
                      onClick={handleUploadSkin}
                      disabled={saving}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        fontWeight: '600',
                        borderRadius: '12px',
                        opacity: saving ? 0.5 : 1,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        border: 'none'
                      }}
                    >
                      {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} strokeWidth={2.5} />}
                      <span>{saving ? t('profile.uploading') : t('profile.skinUploadCta')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cloak Card */}
            <div style={{
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{t('profile.cloakCardTitle')}</h3>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('profile.cloak')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ width: '100%', height: '240px', backgroundColor: 'rgba(17, 24, 39, 0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile.skinUrl ? (
                    <SkinViewer3D
                      skinUrl={getTextureUrl(profile.skinUrl)}
                      cloakUrl={getTextureUrl(profile.cloakUrl)}
                      width={220}
                      height={220}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <ImageIcon size={48} style={{ opacity: 0.5, margin: '0 auto' }} strokeWidth={1.5} />
                      <p style={{ fontSize: '14px', fontWeight: '500' }}>{t('profile.uploadSkinFirst')}</p>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      {t('profile.cloakUploadLabel')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={cloakInputRef}
                        type="file"
                        accept="image/png,image/gif"
                        onChange={(e) => setCloakFile(e.target.files?.[0] || null)}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                        aria-label={t('profile.cloakUploadLabel')}
                        title={t('profile.cloakUploadLabel')}
                      />
                      <div style={{
                        width: '100%',
                        padding: '12px 24px',
                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '14px' }}>
                          {cloakFile ? cloakFile.name : t('profile.noFileChosen')}
                        </span>
                        <button
                          type="button"
                          onClick={() => cloakInputRef.current?.click()}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6366f1',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {t('profile.chooseFile')}
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>{t('profile.cloakUploadHint')}</p>
                  </div>
                  {cloakFile && (
                    <button
                      onClick={handleUploadCloak}
                      disabled={saving}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        backgroundColor: '#6366f1',
                        color: '#fff',
                        fontWeight: '600',
                        borderRadius: '12px',
                        opacity: saving ? 0.5 : 1,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        border: 'none'
                      }}
                    >
                      {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} strokeWidth={2.5} />}
                      <span>{saving ? t('profile.uploading') : t('profile.cloakUploadCta')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
