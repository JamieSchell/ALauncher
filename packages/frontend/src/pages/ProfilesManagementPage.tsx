/**
 * Profiles Management Page - для администраторов
 */

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { profilesAPI } from '../api/profiles';
import { ClientProfile } from '@modern-launcher/shared';
import ProfileFormModal from '../components/ProfileFormModal';

export default function ProfilesManagementPage() {
  const queryClient = useQueryClient();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ClientProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.getProfiles,
  });

  const handleCreate = () => {
    setEditingProfile(null);
    setShowFormModal(true);
  };

  const handleEdit = (profile: ClientProfile) => {
    setEditingProfile(profile);
    setShowFormModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await profilesAPI.deleteProfile(id);
      if (result.success) {
        // Invalidate and refetch profiles
        await queryClient.invalidateQueries({ queryKey: ['profiles'] });
        await refetch();
      } else {
        alert(result.error || 'Failed to delete profile');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    await refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-lg">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-sm">
            <div className="h-10 w-64 bg-gray-700/50 rounded-lg animate-pulse" />
            <div className="h-6 w-96 bg-gray-700/30 rounded-lg animate-pulse" />
          </div>
          <div className="flex gap-base">
            <div className="h-10 w-24 bg-gray-700/50 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-gray-700/50 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Profiles Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-elevated/90 border border-white/15 rounded-xl p-lg space-y-base">
              <div className="flex items-start justify-between">
                <div className="space-y-sm flex-1">
                  <div className="h-6 w-3/4 bg-gray-700/50 rounded-lg animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-700/30 rounded-lg animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-700/50 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-sm">
                <div className="h-4 w-full bg-gray-700/30 rounded-lg animate-pulse" />
                <div className="h-4 w-full bg-gray-700/30 rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-700/30 rounded-lg animate-pulse" />
              </div>
              <div className="flex gap-sm pt-sm">
                <div className="h-9 w-20 bg-gray-700/50 rounded-lg animate-pulse" />
                <div className="h-9 w-20 bg-gray-700/50 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const profileList = profiles?.map(item => item.profile) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Manage Profiles</h1>
          <p className="text-gray-400">Create, edit, and delete Minecraft profiles</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Create Profile</span>
          </button>
        </div>
      </div>

      {profileList.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Profiles Found</h2>
            <p className="text-gray-400 mb-6">Create your first profile to get started</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              <span>Create Profile</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profileList.map((profile) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900/60 backdrop-blur-xl border border-white/15 rounded-xl p-6 relative shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{profile.title}</h3>
                  <p className="text-sm text-gray-400">Minecraft {profile.version}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    profile.enabled 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {profile.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Server:</span>
                  <span className="text-white">{profile.serverAddress}:{profile.serverPort}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Main Class:</span>
                  <span className="text-white font-mono text-xs truncate max-w-[200px]" title={profile.mainClass}>
                    {profile.mainClass}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Sort Index:</span>
                  <span className="text-white">{profile.sortIndex}</span>
                </div>
              </div>

              {profile.tags && profile.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {profile.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleEdit(profile)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  disabled={deletingId === profile.id}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deletingId === profile.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ProfileFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingProfile(null);
        }}
        onSuccess={handleFormSuccess}
        profile={editingProfile}
      />
    </div>
  );
}

