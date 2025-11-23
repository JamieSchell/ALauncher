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
  XCircle
} from 'lucide-react';
import { usersAPI, UserProfile } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import SkinViewer3D from '../components/SkinViewer3D';

// Helper function to get base URL for static files
const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7240/api';
  // Remove /api suffix if present
  return apiUrl.replace(/\/api$/, '');
};

// Helper function to get full URL for texture
const getTextureUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getBaseUrl()}${url}`;
};

export default function ProfilePage() {
  const { playerProfile, setAuth, accessToken } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'textures'>('profile');
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
        setMessage({ type: 'success', text: 'Email updated successfully!' });
        // Update auth store
        if (playerProfile && accessToken) {
          setAuth(accessToken, { ...playerProfile, email: result.data!.email || undefined }, profile.role);
        }
        await refetch();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to update email' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
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
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to change password' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSkin = async () => {
    if (!skinFile) return;

    // Validate file type
    if (!skinFile.type.includes('image/png')) {
      setMessage({ type: 'error', text: 'Only PNG images are allowed' });
      return;
    }

    // Validate file size (2MB max)
    if (skinFile.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      const result = await usersAPI.uploadSkin(skinFile);
      if (result.success) {
        setMessage({ type: 'success', text: 'Skin uploaded successfully!' });
        // Update auth store
        if (playerProfile && accessToken) {
          setAuth(accessToken, { ...playerProfile, skinUrl: result.data!.skinUrl || undefined }, profile!.role);
        }
        setSkinFile(null);
        await refetch();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to upload skin' 
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
      setMessage({ type: 'error', text: 'Only PNG or GIF images are allowed for cloaks' });
      return;
    }

    // Validate file size (5MB max for cloaks, including animated GIFs)
    if (cloakFile.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      const result = await usersAPI.uploadCloak(cloakFile);
      if (result.success) {
        setMessage({ type: 'success', text: 'Cloak uploaded successfully!' });
        // Update auth store
        if (playerProfile && accessToken) {
          setAuth(accessToken, { ...playerProfile, cloakUrl: result.data!.cloakUrl || undefined }, profile!.role);
        }
        setCloakFile(null);
        await refetch();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to upload cloak' 
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>

      {/* Message display */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-start gap-6">
          <div className="w-64 h-64 bg-white/5 rounded-lg overflow-hidden border border-white/10 relative">
            {profile.skinUrl ? (
              <SkinViewer3D 
                skinUrl={getTextureUrl(profile.skinUrl)} 
                cloakUrl={getTextureUrl(profile.cloakUrl)}
                width={256}
                height={256}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No skin</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <User className="text-primary-500" size={24} />
                <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                {profile.role === 'ADMIN' && (
                  <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full flex items-center gap-1">
                    <Shield size={12} />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">UUID: {profile.uuid}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Mail size={16} />
                <span>Email: {profile.email || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar size={16} />
                <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          className={`px-4 py-2 text-lg font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-primary-400 border-b-2 border-primary-500'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`px-4 py-2 text-lg font-medium transition-colors ${
            activeTab === 'password'
              ? 'text-primary-400 border-b-2 border-primary-500'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('password')}
        >
          Password
        </button>
        <button
          className={`px-4 py-2 text-lg font-medium transition-colors ${
            activeTab === 'textures'
              ? 'text-primary-400 border-b-2 border-primary-500'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('textures')}
        >
          Textures
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="your.email@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Your email address (optional)</p>
          </div>

          <button
            onClick={handleUpdateEmail}
            disabled={saving || email === (profile.email || '')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Enter current password"
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Enter new password (min 6 characters)"
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
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Confirm new password"
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

          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Changing...</span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>Change Password</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Textures Tab */}
      {activeTab === 'textures' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 space-y-6"
        >
          {/* Skin Upload */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Skin</h3>
            <div className="flex items-start gap-6">
              <div className="w-64 h-64 bg-white/5 rounded-lg overflow-hidden border border-white/10 relative">
                {profile.skinUrl ? (
                  <SkinViewer3D 
                    skinUrl={getTextureUrl(profile.skinUrl)} 
                    cloakUrl={null}
                    width={256}
                    height={256}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No skin</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Skin (PNG, max 2MB)
                  </label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={(e) => setSkinFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minecraft skins should be 64x64 or 64x32 pixels PNG format
                  </p>
                </div>
                
                {skinFile && (
                  <button
                    onClick={handleUploadSkin}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span>Upload Skin</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cloak Upload */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-bold text-white mb-4">Cloak</h3>
            <div className="flex items-start gap-6">
              <div className="w-64 h-64 bg-white/5 rounded-lg overflow-hidden border border-white/10 relative">
                {profile.skinUrl ? (
                  <SkinViewer3D 
                    skinUrl={getTextureUrl(profile.skinUrl)} 
                    cloakUrl={getTextureUrl(profile.cloakUrl)}
                    width={256}
                    height={256}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Upload a skin first to preview cloak</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Cloak (PNG or GIF, max 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/gif"
                    onChange={(e) => setCloakFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minecraft cloaks: PNG (22x17 pixels) or animated GIF (22x17 pixels per frame)
                  </p>
                </div>
                
                {cloakFile && (
                  <button
                    onClick={handleUploadCloak}
                    disabled={saving}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span>Upload Cloak</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

