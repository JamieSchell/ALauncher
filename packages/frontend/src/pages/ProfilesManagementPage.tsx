/**
 * Profiles Management Page - для администраторов
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, AlertCircle, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { ClientProfile } from '@modern-launcher/shared';
import ProfileFormModal from '../components/ProfileFormModal';
import { useProfiles, useCreateProfile, useUpdateProfile, useDeleteProfile } from '../hooks/api';
import { Card, Button } from '../components/ui';
import { useTranslation } from '../hooks/useTranslation';
import { tauriApi } from '../api/tauri';

export default function ProfilesManagementPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ClientProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: profiles, isLoading, refetch } = useProfiles();
  const createProfileMutation = useCreateProfile();
  const updateProfileMutation = useUpdateProfile();
  const deleteProfileMutation = useDeleteProfile();

  const handleCreate = () => {
    setEditingProfile(null);
    setShowFormModal(true);
  };

  const handleEdit = (profile: ClientProfile) => {
    setEditingProfile(profile);
    setShowFormModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await tauriApi.showConfirmDialog({
      title: 'ALauncher - Confirm Deletion',
      message: 'Are you sure you want to delete this profile? This action cannot be undone.',
      type: 'warning',
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteProfileMutation.mutateAsync(id);
      if (result.success) {
        await refetch();
      } else {
        await tauriApi.showMessageBox({
          title: 'ALauncher - Error',
          message: result.error || 'Failed to delete profile',
          type: 'error',
        });
      }
    } catch (error: any) {
      await tauriApi.showMessageBox({
        title: 'ALauncher - Error',
        message: error.response?.data?.error || error.message || 'An error occurred',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: '40px', width: '256px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <div style={{ height: '24px', width: '384px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ height: '40px', width: '96px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <div style={{ height: '40px', width: '128px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
        </div>

        {/* Profiles Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <div style={{ height: '24px', width: '75%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                  <div style={{ height: '16px', width: '50%', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                </div>
                <div style={{ height: '24px', width: '64px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '16px', width: '100%', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div style={{ height: '16px', width: '100%', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div style={{ height: '16px', width: '75%', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                <div style={{ height: '36px', width: '80px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div style={{ height: '36px', width: '80px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const profileList = profiles?.map(item => item.profile) || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('ui.backToDashboard')}
          </button>
          <h1 className="text-base font-display font-bold text-white">{t('admin.manageProfiles')}</h1>
          <p className="text-gray-400 text-xs">{t('ui.createEditDelete')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleCreate}
          >
            Create Profile
          </Button>
        </div>
      </div>

      {profileList.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={64} style={{ color: 'rgba(234, 179, 8, 1)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>No Profiles Found</h2>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>Create your first profile to get started</p>
            <button
              onClick={handleCreate}
              style={{ padding: '8px 24px', background: 'linear-gradient(to right, rgba(99, 102, 241, 1), rgba(99, 102, 241, 1))', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
            >
              <Plus size={20} />
              <span>Create Profile</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profileList.map((profile) => (
            <div
              key={profile.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                position: 'relative',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{profile.title}</h3>
                  <p style={{ fontSize: '14px' }}>Minecraft {profile.version}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: profile.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: profile.enabled ? 'rgba(74, 222, 128, 1)' : 'rgba(248, 113, 113, 1)'
                  }}>
                    {profile.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Server:</span>
                  <span>{profile.serverAddress}:{profile.serverPort}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Main Class:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={profile.mainClass}>
                    {profile.mainClass}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Sort Index:</span>
                  <span>{profile.sortIndex}</span>
                </div>
              </div>

              {profile.tags && profile.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {profile.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: 'rgba(167, 139, 250, 1)',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  onClick={() => handleEdit(profile)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  disabled={deletingId === profile.id}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'rgba(248, 113, 113, 1)',
                    cursor: deletingId === profile.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: deletingId === profile.id ? 0.5 : 1
                  }}
                >
                  {deletingId === profile.id ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
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
