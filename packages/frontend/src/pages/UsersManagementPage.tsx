/**
 * Users Management Page - для администраторов
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trash2, Ban, Unlock, Search, Loader2, RefreshCw, Shield, User, Mail, Calendar, X, Filter, ChevronDown, Edit, ArrowLeft } from 'lucide-react';
import { usersAPI, UserListItem } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import { Card, Button, Input } from '../components/ui';
import { useTranslation } from '../hooks/useTranslation';
import { tauriApi, isTauri } from '../api/tauri';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { playerProfile } = useAuthStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [bannedFilter, setBannedFilter] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [banReason, setBanReason] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: usersData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['users', debouncedSearchTerm, roleFilter, bannedFilter],
    queryFn: () => usersAPI.getUsers({
      search: debouncedSearchTerm || undefined,
      role: roleFilter || undefined,
      banned: bannedFilter === 'true' ? true : bannedFilter === 'false' ? false : undefined,
    }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
  });

  const users = usersData?.data || [];

  const handleBan = async (user: UserListItem, banned: boolean) => {
    if (user.id === playerProfile?.uuid) {
      await tauriApi.showMessageBox({
        title: 'ALauncher - Error',
        message: 'Cannot ban yourself',
        type: 'error',
      });
      return;
    }

    if (user.role === 'ADMIN' && banned) {
      await tauriApi.showMessageBox({
        title: 'ALauncher - Error',
        message: 'Cannot ban another administrator',
        type: 'error',
      });
      return;
    }

    if (banned && !banReason.trim()) {
      setSelectedUser(user);
      setShowBanModal(true);
      return;
    }

    setBanningId(user.id);
    try {
      const result = await usersAPI.banUser(user.id, banned, banned ? banReason : undefined);
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['users'] });
        await refetch();
        setShowBanModal(false);
        setBanReason('');
        setSelectedUser(null);
      } else {
        await tauriApi.showMessageBox({
          title: 'ALauncher - Error',
          message: result.error || 'Failed to update user ban status',
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
      setBanningId(null);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    // Prevent editing other admins (except yourself)
    if (selectedUser.role === 'ADMIN' && selectedUser.id !== playerProfile?.uuid) {
      await tauriApi.showMessageBox({
        title: 'ALauncher - Error',
        message: 'Cannot edit another administrator',
        type: 'error',
      });
      return;
    }

    setEditingId(selectedUser.id);
    try {
      const updateData: { username?: string; email?: string; role?: 'USER' | 'ADMIN' } = {};
      if (editUsername !== selectedUser.username) {
        updateData.username = editUsername;
      }
      if (editEmail !== (selectedUser.email || '')) {
        updateData.email = editEmail || null;
      }
      if (editRole !== selectedUser.role) {
        updateData.role = editRole;
      }

      if (Object.keys(updateData).length === 0) {
        setShowEditModal(false);
        setSelectedUser(null);
        return;
      }

      const result = await usersAPI.updateUser(selectedUser.id, updateData);
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['users'] });
        await refetch();
        setShowEditModal(false);
        setSelectedUser(null);
        setEditUsername('');
        setEditEmail('');
        setEditRole('USER');
      } else {
        await tauriApi.showMessageBox({
          title: 'ALauncher - Error',
          message: result.error || 'Failed to update user',
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
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (id === playerProfile?.uuid) {
      await tauriApi.showMessageBox({
        title: 'ALauncher - Error',
        message: 'Cannot delete yourself',
        type: 'error',
      });
      return;
    }

    const confirmed = await tauriApi.showConfirmDialog({
      title: 'ALauncher - Confirm Deletion',
      message: `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      type: 'warning',
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await usersAPI.deleteUser(id);
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['users'] });
        await refetch();
      } else {
        await tauriApi.showMessageBox({
          title: 'ALauncher - Error',
          message: result.error || 'Failed to delete user',
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setBannedFilter('');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasFilters = searchTerm || roleFilter || bannedFilter;

  // Show loading only on initial load, not when fetching with filters
  const showInitialLoading = isLoading && !debouncedSearchTerm && !roleFilter && !bannedFilter;

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
          <h1 className="text-base font-display font-bold text-white">{t('admin.userManagement')}</h1>
          <p className="text-gray-400 text-xs">{t('ui.viewBanManage')}</p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-techno-cyan" />
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">{t('ui.filters')}</h3>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              leftIcon={<X className="w-3 h-3" />}
              onClick={handleClearFilters}
              className="text-xs h-7"
            >
              {t('ui.clearAll')}
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username or email..."
            leftIcon={<Search className="w-3 h-3" />}
            className="text-xs"
          />
          
          <div className="w-full">
            <label className="flex items-center gap-2 text-xs font-bold text-techno-cyan mb-2 uppercase tracking-widest opacity-80">
              <Shield className="w-3 h-3" />
              Role
            </label>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-dark-panel/80 backdrop-blur-md border border-white/5 clip-cyber-corner text-white text-xs py-2 px-4 pr-10 focus:outline-none focus:border-techno-cyan transition-colors font-mono appearance-none cursor-pointer"
              >
                <option value="" className="bg-dark-panel">All Roles</option>
                <option value="USER" className="bg-dark-panel">User</option>
                <option value="ADMIN" className="bg-dark-panel">Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          
          <div className="w-full">
            <label className="flex items-center gap-2 text-xs font-bold text-techno-cyan mb-2 uppercase tracking-widest opacity-80">
              <Ban className="w-3 h-3" />
              Ban Status
            </label>
            <div className="relative">
              <select
                value={bannedFilter}
                onChange={(e) => setBannedFilter(e.target.value)}
                className="w-full bg-dark-panel/80 backdrop-blur-md border border-white/5 clip-cyber-corner text-white text-xs py-2 px-4 pr-10 focus:outline-none focus:border-techno-cyan transition-colors font-mono appearance-none cursor-pointer"
              >
                <option value="" className="bg-dark-panel">All</option>
                <option value="false" className="bg-dark-panel">Not Banned</option>
                <option value="true" className="bg-dark-panel">Banned</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Users List */}
      {showInitialLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px'
              }}
            >
              <div style={{ width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '20px', width: '128px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div style={{ height: '16px', width: '192px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              </div>
              <div style={{ height: '32px', width: '80px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
          <div style={{ textAlign: 'center' }}>
            <User size={64} style={{ color: 'rgba(75, 85, 99, 1)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '14px' }}>No users found</p>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {isFetching && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 10,
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} style={{ color: 'rgba(99, 102, 241, 1)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '12px' }}>Refreshing...</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(24px)',
                  border: user.banned ? '2px solid rgba(239, 68, 68, 1)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {user.role === 'ADMIN' ? (
                        <Shield size={20} style={{ color: 'rgba(99, 102, 241, 1)' }} />
                      ) : (
                        <User size={20} style={{ color: 'rgba(156, 163, 175, 1)' }} />
                      )}
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>{user.username}</span>
                      {user.role === 'ADMIN' && (
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: 'rgba(167, 139, 250, 1)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          Admin
                        </span>
                      )}
                      {user.banned && (
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: 'rgba(248, 113, 113, 1)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          Banned
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {user.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} />
                        <span>Joined: {formatDate(user.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} />
                        <span>Last login: {formatDate(user.lastLogin)}</span>
                      </div>
                      {user.banned && user.banReason && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Ban size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.banReason}>
                            Reason: {user.banReason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setEditUsername(user.username);
                        setEditEmail(user.email || '');
                        setEditRole(user.role);
                        setShowEditModal(true);
                      }}
                      disabled={editingId === user.id}
                      style={{
                        padding: '8px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'rgba(96, 165, 250, 1)',
                        cursor: editingId === user.id ? 'not-allowed' : 'pointer',
                        opacity: editingId === user.id ? 0.5 : 1
                      }}
                      title="Edit user"
                    >
                      {editingId === user.id ? (
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Edit size={18} />
                      )}
                    </button>
                    {user.id !== playerProfile?.uuid && user.role !== 'ADMIN' && (
                      <>
                        {user.banned ? (
                          <button
                            onClick={() => handleBan(user, false)}
                            disabled={banningId === user.id}
                            style={{
                              padding: '8px',
                              background: 'rgba(34, 197, 94, 0.2)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'rgba(74, 222, 128, 1)',
                              cursor: banningId === user.id ? 'not-allowed' : 'pointer',
                              opacity: banningId === user.id ? 0.5 : 1
                            }}
                            title="Unban user"
                          >
                            {banningId === user.id ? (
                              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Unlock size={18} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(user, true)}
                            disabled={banningId === user.id}
                            style={{
                              padding: '8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'rgba(248, 113, 113, 1)',
                              cursor: banningId === user.id ? 'not-allowed' : 'pointer',
                              opacity: banningId === user.id ? 0.5 : 1
                            }}
                            title="Ban user"
                          >
                            {banningId === user.id ? (
                              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Ban size={18} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={deletingId === user.id}
                          style={{
                            padding: '8px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'rgba(248, 113, 113, 1)',
                            cursor: deletingId === user.id ? 'not-allowed' : 'pointer',
                            opacity: deletingId === user.id ? 0.5 : 1
                          }}
                          title="Delete user"
                        >
                          {deletingId === user.id ? (
                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '448px',
            width: '100%',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Ban User</h2>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setSelectedUser(null);
                }}
                style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                <X size={20} style={{ color: 'rgba(156, 163, 175, 1)' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ marginBottom: '8px' }}>
                  Are you sure you want to ban <span style={{ fontWeight: 600 }}>{selectedUser.username}</span>?
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Ban Reason (optional)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning this user..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'none'
                  }}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                    setSelectedUser(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBan(selectedUser, true)}
                  disabled={banningId === selectedUser.id}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: 'rgba(239, 68, 68, 1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: banningId === selectedUser.id ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: banningId === selectedUser.id ? 0.5 : 1
                  }}
                >
                  {banningId === selectedUser.id ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Banning...</span>
                    </>
                  ) : (
                    <span>Ban User</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '448px',
            width: '100%',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditUsername('');
                  setEditEmail('');
                  setEditRole('USER');
                  setSelectedUser(null);
                }}
                style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                <X size={20} style={{ color: 'rgba(156, 163, 175, 1)' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  placeholder="Enter email (optional)"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Role</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'USER' | 'ADMIN')}
                    disabled={selectedUser.role === 'ADMIN' && selectedUser.id !== playerProfile?.uuid}
                    style={{
                      width: '100%',
                      paddingLeft: '12px',
                      paddingRight: '40px',
                      padding: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      appearance: 'none',
                      opacity: (selectedUser.role === 'ADMIN' && selectedUser.id !== playerProfile?.uuid) ? 0.5 : 1
                    }}
                  >
                    <option value="USER" style={{ background: 'rgba(31, 41, 55, 1)' }}>User</option>
                    <option value="ADMIN" style={{ background: 'rgba(31, 41, 55, 1)' }}>Admin</option>
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(156, 163, 175, 1)', pointerEvents: 'none' }} />
                </div>
                {selectedUser.role === 'ADMIN' && selectedUser.id !== playerProfile?.uuid && (
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Cannot change role of another administrator</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditUsername('');
                    setEditEmail('');
                    setSelectedUser(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={editingId === selectedUser.id || !editUsername.trim()}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: 'rgba(99, 102, 241, 1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: (editingId === selectedUser.id || !editUsername.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: (editingId === selectedUser.id || !editUsername.trim()) ? 0.5 : 1
                  }}
                >
                  {editingId === selectedUser.id ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {usersData?.pagination && (
        <div style={{ textAlign: 'center', fontSize: '14px' }}>
          Showing {users.length} of {usersData.pagination.total} users
        </div>
      )}
    </div>
  );
}
