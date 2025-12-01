/**
 * Settings Page - Premium Design 2025
 * Senior UX/UI Designer Implementation
 */

import { motion } from 'framer-motion';
import { Save, Search, Loader2, FolderOpen, RotateCcw, SlidersHorizontal, Cpu, Bell, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import UpdateCheckButton from '../components/UpdateCheckButton';
import React, { useMemo, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { t } = useTranslation();
  const { getAnimationProps, shouldAnimate } = useOptimizedAnimation();
  const [detectingJava, setDetectingJava] = useState(false);
  const [javaDetections, setJavaDetections] = useState<Array<{ path: string; version: string; major: number }>>([]);
  const [showJavaList, setShowJavaList] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'java' | 'notifications' | 'updates'>('general');

  const handleSave = () => {
    alert(t('settings.saveSuccess'));
  };

  const handleAutoDetectJava = async () => {
    if (!window.electronAPI) {
      alert(t('errors.unknownError'));
      return;
    }

    setDetectingJava(true);
    setShowJavaList(false);
    try {
      const result = await window.electronAPI.findJavaInstallations();
      if (result.success && result.installations.length > 0) {
        setJavaDetections(result.installations);
        setShowJavaList(true);
      } else {
        alert(t('settings.autoDetectNoJava'));
      }
    } catch (error: any) {
      alert(`${t('settings.autoDetectFail')}: ${error.message}`);
    } finally {
      setDetectingJava(false);
    }
  };

  const handleSelectJava = (javaPath: string) => {
    settings.updateSettings({ javaPath });
    setShowJavaList(false);
  };

  const handleBrowseJava = async () => {
    if (!window.electronAPI) {
      alert(t('errors.unknownError'));
      return;
    }

    try {
      const result = await window.electronAPI.selectJavaFile();
      if (result.success && result.path) {
        settings.updateSettings({ javaPath: result.path });
        alert(`${t('settings.javaPathLabel')}: ${result.path}\n${t('common.version') ?? 'Version'}: ${result.version || 'unknown'}`);
      } else if (!result.canceled) {
        alert(result.error || t('settings.browseFail'));
      }
    } catch (error: any) {
      alert(`${t('settings.browseFail')}: ${error.message}`);
    }
  };

  const handleResetSettings = () => {
    if (confirm(t('settings.resetConfirm'))) {
      settings.resetSettings();
      alert(t('settings.resetSuccess'));
    }
  };

  // Popular resolution presets
  const resolutionPresets = [
    { label: '1280x720 (HD)', width: 1280, height: 720 },
    { label: '1366x768', width: 1366, height: 768 },
    { label: '1600x900', width: 1600, height: 900 },
    { label: '1920x1080 (Full HD)', width: 1920, height: 1080 },
    { label: '2560x1440 (2K)', width: 2560, height: 1440 },
    { label: '3840x2160 (4K)', width: 3840, height: 2160 },
  ];

  // RAM presets
  const ramPresets = [
    { label: '512 MB', value: 512 },
    { label: '1 GB', value: 1024 },
    { label: '2 GB', value: 2048 },
    { label: '4 GB', value: 4096 },
    { label: '6 GB', value: 6144 },
    { label: '8 GB', value: 8192 },
    { label: '12 GB', value: 12288 },
    { label: '16 GB', value: 16384 },
  ];

  const tabs = useMemo(() => [
    { id: 'general', label: t('settings.tabs.general'), icon: SlidersHorizontal },
    { id: 'java', label: t('settings.tabs.java'), icon: Cpu },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'updates', label: t('settings.tabs.updates'), icon: RefreshCw },
  ], [t]);

  const generalTab = (
    <motion.section
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={getAnimationProps({ duration: 0.3 })}
      className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
      style={{ marginBottom: '32px' }}
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
            <SlidersHorizontal size={22} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-2xl font-bold text-heading">{t('settings.gameSettings')}</h2>
        </div>

        <div className="space-y-6">
          {/* RAM Allocation */}
          <div>
            <label className="block text-sm font-semibold text-heading mb-3">
              {t('settings.ramAllocation')}
            </label>
            <div className="space-y-4">
              <input
                type="range"
                min="512"
                max="16384"
                step="256"
                value={settings.ram}
                onChange={(e) => settings.updateSettings({ ram: parseInt(e.target.value) })}
                className="w-full h-2 bg-surface-base/50 rounded-lg appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-colors"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.ram - 512) / (16384 - 512)) * 100}%, rgba(255,255,255,0.1) ${((settings.ram - 512) / (16384 - 512)) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              <div className="flex items-center justify-between gap-4">
                <input
                  type="number"
                  value={settings.ram}
                  onChange={(e) => settings.updateSettings({ ram: parseInt(e.target.value) || 512 })}
                  className="w-32 px-4 py-3 bg-surface-base/80 border border-white/10 rounded-xl text-heading text-sm focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200"
                  min="512"
                  max="16384"
                  step="256"
                />
                <span className="text-sm text-body-muted font-medium">MB</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ramPresets.map((preset) => (
                  <motion.button
                    key={preset.value}
                    onClick={() => settings.updateSettings({ ram: preset.value })}
                    whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                    whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                      settings.ram === preset.value
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 border border-primary-400/30'
                        : 'bg-surface-base/80 border border-white/10 text-body-muted hover:bg-surface-elevated hover:text-heading hover:border-primary-500/30'
                    }`}
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-body-dim font-medium">Recommended: 2048-4096 MB</p>
            </div>
          </div>

          {/* Window Resolution */}
          <div>
            <label className="block text-sm font-semibold text-heading mb-3">
              {t('settings.windowResolution')}
            </label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-body-subtle mb-2 font-medium">{t('settings.widthLabel')}</label>
                  <input
                    type="number"
                    value={settings.width}
                    onChange={(e) => settings.updateSettings({ width: parseInt(e.target.value) || 1280 })}
                    className="w-full px-4 py-3 bg-surface-base/80 border border-white/10 rounded-xl text-heading text-sm focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200"
                    min="800"
                    max="3840"
                  />
                </div>
                <div>
                  <label className="block text-xs text-body-subtle mb-2 font-medium">{t('settings.heightLabel')}</label>
                  <input
                    type="number"
                    value={settings.height}
                    onChange={(e) => settings.updateSettings({ height: parseInt(e.target.value) || 720 })}
                    className="w-full px-4 py-3 bg-surface-base/80 border border-white/10 rounded-xl text-heading text-sm focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200"
                    min="600"
                    max="2160"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-body-subtle mb-2 font-medium">{t('settings.quickPresets')}</label>
                <div className="flex flex-wrap gap-2">
                  {resolutionPresets.map((preset) => (
                    <motion.button
                      key={preset.label}
                      onClick={() => settings.updateSettings({ width: preset.width, height: preset.height })}
                      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                        settings.width === preset.width && settings.height === preset.height
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 border border-primary-400/30'
                          : 'bg-surface-base/80 border border-white/10 text-body-muted hover:bg-surface-elevated hover:text-heading hover:border-primary-500/30'
                      }`}
                    >
                      {preset.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <motion.label
              whileHover={shouldAnimate ? { x: 4 } : undefined}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={settings.fullScreen}
                onChange={(e) => settings.updateSettings({ fullScreen: e.target.checked })}
                className="w-5 h-5 rounded border-white/10 bg-surface-base/80 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base cursor-pointer transition-all duration-200"
              />
              <span className="text-sm font-medium text-heading group-hover:text-primary-400 transition-colors">
                {t('settings.fullScreenLabel')}
              </span>
            </motion.label>

            <motion.label
              whileHover={shouldAnimate ? { x: 4 } : undefined}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={settings.autoEnter}
                onChange={(e) => settings.updateSettings({ autoEnter: e.target.checked })}
                className="w-5 h-5 rounded border-white/10 bg-surface-base/80 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base cursor-pointer transition-all duration-200"
              />
              <span className="text-sm font-medium text-heading group-hover:text-primary-400 transition-colors">
                {t('settings.autoEnterLabel')}
              </span>
            </motion.label>
          </div>
        </div>
      </div>
    </motion.section>
  );

  const javaTab = (
    <motion.section
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={getAnimationProps({ duration: 0.3 })}
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
            <Cpu size={22} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-2xl font-bold text-heading">{t('settings.javaSettings')}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-heading mb-3">
              {t('settings.javaPathLabel')}
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={settings.javaPath}
                onChange={(e) => settings.updateSettings({ javaPath: e.target.value })}
                className="flex-1 px-4 py-3 bg-surface-base/80 border border-white/10 rounded-xl text-heading focus:outline-none focus:border-primary-500 focus:bg-surface-elevated/90 transition-all duration-200"
                placeholder="/path/to/java"
              />
              <motion.button
                onClick={handleBrowseJava}
                disabled={!window.electronAPI}
                whileHover={shouldAnimate && window.electronAPI ? { scale: 1.05 } : undefined}
                whileTap={shouldAnimate && window.electronAPI ? { scale: 0.95 } : undefined}
                className="px-5 py-3 bg-gradient-to-r from-surface-base/80 to-surface-elevated/60 border border-white/10 hover:border-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-heading rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold text-sm shadow-sm"
                title={t('settings.browse')}
              >
                <FolderOpen size={18} strokeWidth={2.5} />
                <span>{t('settings.browse')}</span>
              </motion.button>
              <motion.button
                onClick={handleAutoDetectJava}
                disabled={detectingJava || !window.electronAPI}
                whileHover={shouldAnimate && !detectingJava && window.electronAPI ? { scale: 1.05 } : undefined}
                whileTap={shouldAnimate && !detectingJava && window.electronAPI ? { scale: 0.95 } : undefined}
                className="px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold text-sm shadow-lg shadow-primary-500/30 border border-primary-400/30"
                title={t('settings.autoDetect')}
              >
                {detectingJava ? (
                  <>
                    <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                    <span>{t('settings.detecting')}</span>
                  </>
                ) : (
                  <>
                    <Search size={18} strokeWidth={2.5} />
                    <span>{t('settings.autoDetect')}</span>
                  </>
                )}
              </motion.button>
            </div>
            <p className="text-xs text-body-dim mt-2 font-medium">{t('settings.leaveAsJava')}</p>
          </div>

          {showJavaList && javaDetections.length > 0 && (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              className="bg-gradient-to-br from-surface-base/90 to-surface-elevated/70 border border-white/10 rounded-2xl p-4 lg:p-6 shadow-lg"
            >
              <h3 className="text-sm font-semibold text-heading mb-4">{t('settings.foundJava')}:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {javaDetections.map((java, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSelectJava(java.path)}
                    whileHover={shouldAnimate ? { x: 4 } : undefined}
                    className="w-full text-left px-4 py-3 bg-surface-base/80 hover:bg-surface-elevated/90 rounded-xl border border-white/10 hover:border-primary-500/30 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-heading">{java.path}</div>
                        <div className="text-xs text-body-muted mt-1">Java {java.version} (Major: {java.major})</div>
                      </div>
                      {settings.javaPath === java.path && (
                        <span className="text-xs bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 rounded-lg font-semibold border border-primary-400/30">
                          {t('settings.selectedLabel')}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );

  const notificationsTab = (
    <motion.section
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={getAnimationProps({ duration: 0.3 })}
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
            <Bell size={22} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-2xl font-bold text-heading">{t('settings.notificationSettings')}</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface-base/50 rounded-xl border border-white/10">
            <div>
              <label className="text-sm font-semibold text-heading">{t('settings.desktopNotifications')}</label>
              <p className="text-xs text-body-dim mt-1 font-medium">{t('settings.desktopDescription')}</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications?.desktop ?? true}
              onChange={(e) => settings.updateSettings({ 
                notifications: { 
                  ...settings.notifications, 
                  desktop: e.target.checked 
                } 
              })}
              className="w-5 h-5 rounded border-white/10 bg-surface-base/80 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base cursor-pointer transition-all duration-200"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-heading">{t('settings.notificationTypes')}</label>
            
            <div className="space-y-3">
              {[
                { key: 'clientUpdates', label: t('settings.typeClientUpdates') },
                { key: 'serverStatus', label: t('settings.typeServerStatus') },
                { key: 'gameCrashes', label: t('settings.typeGameCrashes') },
                { key: 'connectionIssues', label: t('settings.typeConnectionIssues') },
                { key: 'launcherErrors', label: t('settings.typeLauncherErrors') },
                { key: 'systemMessages', label: t('settings.typeSystemMessages') },
              ].map((type) => (
                <motion.div
                  key={type.key}
                  whileHover={shouldAnimate ? { x: 4 } : undefined}
                  className="flex items-center justify-between p-3 bg-surface-base/50 rounded-xl border border-white/10 hover:border-primary-500/30 transition-all duration-200"
                >
                  <label className="text-sm text-body-muted font-medium cursor-pointer hover:text-heading transition-colors">{type.label}</label>
                  <input
                    type="checkbox"
                    checked={settings.notifications?.[type.key as keyof typeof settings.notifications] ?? true}
                    onChange={(e) => settings.updateSettings({ 
                      notifications: { 
                        ...settings.notifications, 
                        [type.key]: e.target.checked 
                      } 
                    })}
                    className="w-5 h-5 rounded border-white/10 bg-surface-base/80 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base cursor-pointer transition-all duration-200"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-base/50 rounded-xl border border-white/10">
            <div>
              <label className="text-sm font-semibold text-heading">{t('settings.notificationSound')}</label>
              <p className="text-xs text-body-dim mt-1 font-medium">{t('settings.soundDescription')}</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications?.sound ?? true}
              onChange={(e) => settings.updateSettings({ 
                notifications: { 
                  ...settings.notifications, 
                  sound: e.target.checked 
                } 
              })}
              className="w-5 h-5 rounded border-white/10 bg-surface-base/80 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-base cursor-pointer transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );

  const updatesTab = (
    <motion.section
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
      transition={getAnimationProps({ duration: 0.3 })}
      className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-4">
          <motion.div
            className="p-3 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-xl border border-primary-500/30 shadow-sm shadow-primary-500/10"
            whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
          >
            <RefreshCw size={22} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-2xl font-bold text-heading">{t('settings.updatesTitle')}</h2>
        </div>
        <p className="text-sm text-body-muted leading-relaxed">{t('settings.updatesDescription')}</p>
        <UpdateCheckButton />
      </div>
    </motion.section>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'java':
        return javaTab;
      case 'notifications':
        return notificationsTab;
      case 'updates':
        return updatesTab;
      default:
        return generalTab;
    }
  };

  return (
    <div className="space-y-xl" style={{ paddingBottom: '32px' }}>
      {/* Hero Section */}
      <motion.section
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.3 })}
        className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-8 lg:p-10 border border-white/10 shadow-lg backdrop-blur-sm"
        style={{ marginBottom: '48px' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
        
        <div className="relative z-10 flex items-start gap-6 lg:gap-8">
          <motion.div
            initial={shouldAnimate ? { scale: 0, rotate: -180 } : false}
            animate={shouldAnimate ? { scale: 1, rotate: 0 } : false}
            transition={getAnimationProps({ duration: 0.5, delay: 0.1 })}
            className="flex-shrink-0 p-4 lg:p-5 bg-gradient-to-br from-primary-500/20 to-primary-600/15 rounded-2xl border border-primary-500/30 shadow-lg shadow-primary-500/10"
            whileHover={shouldAnimate ? { scale: 1.1, rotate: 5 } : undefined}
          >
            <SettingsIcon size={32} className="text-primary-400" strokeWidth={2.5} />
          </motion.div>
          
          <div className="flex-1 min-w-0 space-y-3 lg:space-y-4">
            <motion.h1
              initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
              transition={getAnimationProps({ duration: 0.4, delay: 0.2 })}
              className="text-4xl lg:text-5xl font-black text-heading leading-tight tracking-tight"
            >
              {t('settings.pageTitle')}
            </motion.h1>
            <motion.p
              initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
              animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
              transition={getAnimationProps({ duration: 0.4, delay: 0.3 })}
              className="text-body-muted text-lg lg:text-xl leading-relaxed max-w-2xl"
            >
              {t('settings.pageDescription')}
            </motion.p>
          </div>
        </div>
      </motion.section>

      {/* Tabs Container */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={getAnimationProps({ duration: 0.3, delay: 0.1 })}
        className="relative overflow-hidden bg-gradient-to-br from-surface-elevated/90 to-surface-base/70 rounded-3xl p-6 lg:p-8 border border-white/10 shadow-lg backdrop-blur-sm"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0MCAwIEwgNDAgNDAgTCAwIDQwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent" />
        
        <div className="relative z-10 space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-3 border-b border-white/10 pb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 border border-primary-400/30'
                      : 'bg-surface-base/80 border border-white/10 text-body-muted hover:bg-surface-elevated hover:text-heading hover:border-primary-500/30'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div>{renderActiveTab()}</div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-white/10 gap-4">
            <motion.button
              onClick={handleResetSettings}
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              className="px-6 py-3 bg-gradient-to-r from-surface-base/80 to-surface-elevated/60 border border-white/10 hover:border-primary-500/30 text-heading font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
              <span>{t('settings.resetButton')}</span>
            </motion.button>
            <motion.button
              onClick={handleSave}
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-600 hover:from-primary-600 hover:via-primary-700 hover:to-primary-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-primary-500/30 border border-primary-400/30"
            >
              <Save size={20} strokeWidth={2.5} />
              <span>{t('settings.saveButton')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
