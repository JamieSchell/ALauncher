/**
 * Users Management Page - для администраторов
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trash2, Ban, Unlock, Search, Loader2, RefreshCw, Shield, User, Mail, Calendar, X, Filter, ChevronDown, Edit } from 'lucide-react';
import { usersAPI, UserListItem } from '../api/users';
import { useAuthStore } from '../stores/authStore';

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
  const queryClient = useQueryClient();
  const { playerProfile } = useAuthStore();
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
      alert('Cannot ban yourself');
      return;
    }

    if (user.role === 'ADMIN' && banned) {
      alert('Cannot ban another administrator');
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
        alert(result.error || 'Failed to update user ban status');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'An error occurred');
    } finally {
      setBanningId(null);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    // Prevent editing other admins (except yourself)
    if (selectedUser.role === 'ADMIN' && selectedUser.id !== playerProfile?.uuid) {
      alert('Cannot edit another administrator');
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
        alert(result.error || 'Failed to update user');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'An error occurred');
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (id === playerProfile?.uuid) {
      alert('Cannot delete yourself');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await usersAPI.deleteUser(id);
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['users'] });
        await refetch();
      } else {
        alert(result.error || 'Failed to delete user');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'An error occurred');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Manage Users</h1>
          <p className="text-gray-400">View, ban, and manage user accounts</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                <option value="" className="bg-gray-800">All Roles</option>
                <option value="USER" className="bg-gray-800">User</option>
                <option value="ADMIN" className="bg-gray-800">Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ban Status</label>
            <div className="relative">
              <select
                value={bannedFilter}
                onChange={(e) => setBannedFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                <option value="" className="bg-gray-800">All</option>
                <option value="false" className="bg-gray-800">Not Banned</option>
                <option value="true" className="bg-gray-800">Banned</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-end">
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <X size={16} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Users List */}
      {showInitialLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {isFetching && (
            <div className="absolute top-0 right-0 z-10 p-2">
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            </div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-xl p-4 hover:bg-white/5 transition-colors ${
                user.banned ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {user.role === 'ADMIN' ? (
                      <Shield className="w-5 h-5 text-primary-400" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-lg font-semibold text-white">{user.username}</span>
                    {user.role === 'ADMIN' && (
                      <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 rounded text-xs font-medium">
                        Admin
                      </span>
                    )}
                    {user.banned && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs font-medium">
                        Banned
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {user.email && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail size={14} />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} />
                      <span>Joined: {formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} />
                      <span>Last login: {formatDate(user.lastLogin)}</span>
                    </div>
                    {user.banned && user.banReason && (
                      <div className="flex items-center gap-2 text-red-400">
                        <Ban size={14} />
                        <span className="truncate" title={user.banReason}>
                          Reason: {user.banReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setEditUsername(user.username);
                      setEditEmail(user.email || '');
                      setEditRole(user.role);
                      setShowEditModal(true);
                    }}
                    disabled={editingId === user.id}
                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                    title="Edit user"
                  >
                    {editingId === user.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
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
                          className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Unban user"
                        >
                          {banningId === user.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Unlock size={18} />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBan(user, true)}
                          disabled={banningId === user.id}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Ban user"
                        >
                          {banningId === user.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Ban size={18} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        disabled={deletingId === user.id}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete user"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Ban User</h2>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-300 mb-2">
                  Are you sure you want to ban <span className="font-semibold text-white">{selectedUser.username}</span>?
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ban Reason (optional)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning this user..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBan(selectedUser, true)}
                  disabled={banningId === selectedUser.id}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {banningId === selectedUser.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Banning...</span>
                    </>
                  ) : (
                    <span>Ban User</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditUsername('');
                  setEditEmail('');
                  setEditRole('USER');
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter email (optional)"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Role</label>
                <div className="relative">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as 'USER' | 'ADMIN')}
                    disabled={selectedUser.role === 'ADMIN' && selectedUser.id !== playerProfile?.uuid}
                    className="w-full pl-3 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="USER" className="bg-gray-800">User</option>
                    <option value="ADMIN" className="bg-gray-800">Admin</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {selectedUser.role === 'ADMIN' && selectedUser.id !== playerProfile?.uuid && (
                  <p className="text-xs text-gray-500 mt-1">Cannot change role of another administrator</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditUsername('');
                    setEditEmail('');
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={editingId === selectedUser.id || !editUsername.trim()}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editingId === selectedUser.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pagination Info */}
      {usersData?.pagination && (
        <div className="text-center text-sm text-gray-400">
          Showing {users.length} of {usersData.pagination.total} users
        </div>
      )}
    </div>
  );
}

