/**
 * Profile Form Modal - для создания и редактирования профилей (только для админов)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';
import { ClientProfile, EconomyLeaderboardConfig } from '@modern-launcher/shared';
import { profilesAPI } from '../api/profiles';

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile?: ClientProfile | null;
}

export default function ProfileFormModal({ isOpen, onClose, onSuccess, profile }: ProfileFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState<Partial<ClientProfile & { enabled?: boolean }>>({
    version: '',
    title: '',
    description: '',
    serverAddress: '',
    serverPort: 25565,
    mainClass: 'net.minecraft.client.main.Main',
    classPath: [],
    jvmArgs: [],
    clientArgs: [],
    sortIndex: 0,
    assetIndex: '',
    jvmVersion: '17',
    updateFastCheck: true,
    update: [],
    updateVerify: [],
    updateExclusions: [],
    tags: [],
    enabled: true,
  });

  // Economy config state
  const [economyConfig, setEconomyConfig] = useState<Partial<EconomyLeaderboardConfig>>({
    enabled: false,
    table: '',
    usernameColumn: '',
    balanceColumn: '',
    order: 'desc',
    limit: 10,
    currencySymbol: '',
    precision: 2,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        version: profile.version || '',
        title: profile.title || '',
        description: profile.description || '',
        serverAddress: profile.serverAddress || '',
        serverPort: profile.serverPort || 25565,
        mainClass: profile.mainClass || 'net.minecraft.client.main.Main',
        classPath: profile.classPath || [],
        jvmArgs: profile.jvmArgs || [],
        clientArgs: profile.clientArgs || [],
        sortIndex: profile.sortIndex || 0,
        assetIndex: profile.assetIndex || '',
        jvmVersion: profile.jvmVersion || '17',
        updateFastCheck: profile.updateFastCheck !== undefined ? profile.updateFastCheck : true,
        update: profile.update || [],
        updateVerify: profile.updateVerify || [],
        updateExclusions: profile.updateExclusions || [],
        tags: profile.tags || [],
        enabled: (profile as any).enabled !== undefined ? (profile as any).enabled : true,
      });
      
      // Load economy config
      const ec = (profile.economyConfig as any) || {};
      setEconomyConfig({
        enabled: ec.enabled !== undefined ? ec.enabled : false,
        table: ec.table || '',
        usernameColumn: ec.usernameColumn || '',
        balanceColumn: ec.balanceColumn || '',
        order: ec.order || 'desc',
        limit: ec.limit || 10,
        currencySymbol: ec.currencySymbol || '',
        precision: ec.precision !== undefined ? ec.precision : 2,
      });
    } else {
      // Reset form for new profile
      setFormData({
        version: '',
        title: '',
        description: '',
        serverAddress: '',
        serverPort: 25565,
        mainClass: 'net.minecraft.client.main.Main',
        classPath: [],
        jvmArgs: [],
        clientArgs: [],
        sortIndex: 0,
        assetIndex: '',
        jvmVersion: '17',
        updateFastCheck: true,
        update: [],
        updateVerify: [],
        updateExclusions: [],
        tags: [],
        enabled: true,
      });
      
      // Reset economy config
      setEconomyConfig({
        enabled: false,
        table: '',
        usernameColumn: '',
        balanceColumn: '',
        order: 'desc',
        limit: 10,
        currencySymbol: '',
        precision: 2,
      });
    }
    setError(null);
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prepare economy config
      const finalEconomyConfig: EconomyLeaderboardConfig | null = economyConfig.enabled && 
        economyConfig.table && 
        economyConfig.usernameColumn && 
        economyConfig.balanceColumn
        ? {
            enabled: true,
            table: economyConfig.table,
            usernameColumn: economyConfig.usernameColumn,
            balanceColumn: economyConfig.balanceColumn,
            order: economyConfig.order || 'desc',
            limit: economyConfig.limit || 10,
            currencySymbol: economyConfig.currencySymbol || '',
            precision: economyConfig.precision !== undefined ? economyConfig.precision : 2,
          }
        : economyConfig.enabled === false 
          ? { enabled: false } as any
          : null;

      const profileData = {
        ...formData,
        economyConfig: finalEconomyConfig,
      };

      if (profile) {
        // Update existing profile
        const result = await profilesAPI.updateProfile(profile.id, profileData);
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error || 'Failed to update profile');
        }
      } else {
        // Create new profile
        const result = await profilesAPI.createProfile(profileData);
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error || 'Failed to create profile');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof (ClientProfile & { enabled?: boolean }), value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: 'classPath' | 'jvmArgs' | 'clientArgs' | 'update' | 'updateVerify' | 'updateExclusions' | 'tags', value: string) => {
    const array = value.split('\n').filter(line => line.trim());
    setFormData(prev => ({ ...prev, [field]: array }));
  };

  const getArrayFieldValue = (field: 'classPath' | 'jvmArgs' | 'clientArgs' | 'update' | 'updateVerify' | 'updateExclusions' | 'tags'): string => {
    const array = formData[field] as string[] || [];
    return array.join('\n');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {profile ? 'Edit Profile' : 'Create New Profile'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Version <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.version || ''}
                    onChange={(e) => updateField('version', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    placeholder="1.20.4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    placeholder="Vanilla 1.20.4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="Profile description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Server Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.serverAddress || ''}
                    onChange={(e) => updateField('serverAddress', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    placeholder="play.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Server Port <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.serverPort || 25565}
                    onChange={(e) => updateField('serverPort', parseInt(e.target.value) || 25565)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    min={1}
                    max={65535}
                  />
                </div>
              </div>
            </div>

            {/* Launch Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Launch Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Main Class <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mainClass || ''}
                    onChange={(e) => updateField('mainClass', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                    placeholder="net.minecraft.client.main.Main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Asset Index
                  </label>
                  <input
                    type="text"
                    value={formData.assetIndex || ''}
                    onChange={(e) => updateField('assetIndex', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="1.20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Class Path (one per line)
                </label>
                <textarea
                  value={getArrayFieldValue('classPath')}
                  onChange={(e) => updateArrayField('classPath', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  rows={4}
                  placeholder="./updates/1.20.4/client.jar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  JVM Args (one per line)
                </label>
                <textarea
                  value={getArrayFieldValue('jvmArgs')}
                  onChange={(e) => updateArrayField('jvmArgs', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  rows={3}
                  placeholder="-XX:+UseG1GC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Args (one per line)
                </label>
                <textarea
                  value={getArrayFieldValue('clientArgs')}
                  onChange={(e) => updateArrayField('clientArgs', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  rows={3}
                  placeholder="--username"
                />
              </div>
            </div>

            {/* Additional Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Additional Settings</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sort Index
                  </label>
                  <input
                    type="number"
                    value={formData.sortIndex || 0}
                    onChange={(e) => updateField('sortIndex', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    JVM Version
                  </label>
                  <input
                    type="text"
                    value={formData.jvmVersion || '17'}
                    onChange={(e) => updateField('jvmVersion', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="17"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled !== false}
                      onChange={(e) => updateField('enabled', e.target.checked)}
                      className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-300">Enabled</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (one per line, e.g., NEW, TOP, WIP)
                </label>
                <textarea
                  value={getArrayFieldValue('tags')}
                  onChange={(e) => updateArrayField('tags', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="NEW&#10;TOP"
                />
              </div>
            </div>

            {/* Economy Leaderboard Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">
                Economy Leaderboard (Топ богачей)
              </h3>
              
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={economyConfig.enabled || false}
                  onChange={(e) => setEconomyConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary-500 focus:ring-primary-500"
                />
                <label className="text-sm text-gray-300 cursor-pointer">
                  Enable Economy Leaderboard
                </label>
              </div>

              {economyConfig.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Table Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={economyConfig.table || ''}
                        onChange={(e) => setEconomyConfig(prev => ({ ...prev, table: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="economy_balances"
                        required={economyConfig.enabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">Название таблицы в MySQL</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Limit
                      </label>
                      <input
                        type="number"
                        value={economyConfig.limit || 10}
                        onChange={(e) => setEconomyConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 10 }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min={1}
                        max={20}
                      />
                      <p className="text-xs text-gray-500 mt-1">Количество игроков в топе (1-20)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username Column <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={economyConfig.usernameColumn || ''}
                        onChange={(e) => setEconomyConfig(prev => ({ ...prev, usernameColumn: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="username"
                        required={economyConfig.enabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">Колонка с именем игрока</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Balance Column <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={economyConfig.balanceColumn || ''}
                        onChange={(e) => setEconomyConfig(prev => ({ ...prev, balanceColumn: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="balance"
                        required={economyConfig.enabled}
                      />
                      <p className="text-xs text-gray-500 mt-1">Колонка с балансом</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Order
                      </label>
                      <select
                        value={economyConfig.order || 'desc'}
                        onChange={(e) => setEconomyConfig(prev => ({ ...prev, order: e.target.value as 'asc' | 'desc' }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="desc">Descending (убывание)</option>
                        <option value="asc">Ascending (возрастание)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Currency Symbol
                      </label>
                      <input
                        type="text"
                        value={economyConfig.currencySymbol || ''}
                        onChange={(e) => setEconomyConfig(prev => ({ ...prev, currencySymbol: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="$"
                      />
                      <p className="text-xs text-gray-500 mt-1">Символ валюты (например: $, ₽, €)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Precision
                      </label>
                      <input
                        type="number"
                        value={economyConfig.precision !== undefined ? economyConfig.precision : 2}
                        onChange={(e) => setEconomyConfig(prev => ({ ...prev, precision: parseInt(e.target.value) || 2 }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        min={0}
                        max={10}
                      />
                      <p className="text-xs text-gray-500 mt-1">Количество знаков после запятой</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{profile ? 'Update' : 'Create'} Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

