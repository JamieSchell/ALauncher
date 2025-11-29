/**
 * Settings Page
 */

import { motion } from 'framer-motion';
import { Save, Search, Loader2, FolderOpen, RotateCcw, SlidersHorizontal, Cpu, Bell, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import UpdateCheckButton from '../components/UpdateCheckButton';
import React, { useMemo, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { t } = useTranslation();
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
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">{t('settings.gameSettings')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.ramAllocation')}
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="512"
                  max="16384"
                  step="256"
                  value={settings.ram}
                  onChange={(e) => settings.updateSettings({ ram: parseInt(e.target.value) })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={settings.ram}
                    onChange={(e) => settings.updateSettings({ ram: parseInt(e.target.value) || 512 })}
                    className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="512"
                    max="16384"
                    step="256"
                  />
                  <span className="text-sm text-gray-400">MB</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ramPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => settings.updateSettings({ ram: preset.value })}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        settings.ram === preset.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Recommended: 2048-4096 MB</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.windowResolution')}
              </label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{t('settings.widthLabel')}</label>
                    <input
                      type="number"
                      value={settings.width}
                      onChange={(e) => settings.updateSettings({ width: parseInt(e.target.value) || 1280 })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="800"
                      max="3840"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{t('settings.heightLabel')}</label>
                    <input
                      type="number"
                      value={settings.height}
                      onChange={(e) => settings.updateSettings({ height: parseInt(e.target.value) || 720 })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="600"
                      max="2160"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">{t('settings.quickPresets')}</label>
                  <div className="flex flex-wrap gap-2">
                    {resolutionPresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => settings.updateSettings({ width: preset.width, height: preset.height })}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          settings.width === preset.width && settings.height === preset.height
                            ? 'bg-primary-600 text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="fullscreen"
                checked={settings.fullScreen}
                onChange={(e) => settings.updateSettings({ fullScreen: e.target.checked })}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="fullscreen" className="text-sm font-medium text-gray-300">
                {t('settings.fullScreenLabel')}
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoenter"
                checked={settings.autoEnter}
                onChange={(e) => settings.updateSettings({ autoEnter: e.target.checked })}
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="autoenter" className="text-sm font-medium text-gray-300">
                {t('settings.autoEnterLabel')}
              </label>
            </div>
          </div>
      </section>
    </div>
  );

  const javaTab = (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">{t('settings.javaSettings')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.javaPathLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.javaPath}
                  onChange={(e) => settings.updateSettings({ javaPath: e.target.value })}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="/path/to/java"
                />
                <button
                  onClick={handleBrowseJava}
                  disabled={!window.electronAPI}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  title={t('settings.browse')}
                >
                  <FolderOpen size={18} />
                  <span>{t('settings.browse')}</span>
                </button>
                <button
                  onClick={handleAutoDetectJava}
                  disabled={detectingJava || !window.electronAPI}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  title={t('settings.autoDetect')}
                >
                  {detectingJava ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{t('settings.detecting')}</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>{t('settings.autoDetect')}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('settings.leaveAsJava')}</p>
            </div>

            {showJavaList && javaDetections.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">{t('settings.foundJava')}:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {javaDetections.map((java, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectJava(java.path)}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{java.path}</div>
                          <div className="text-xs text-gray-400">Java {java.version} (Major: {java.major})</div>
                        </div>
                        {settings.javaPath === java.path && (
                          <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded">{t('settings.selectedLabel')}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
      </section>
    </div>
  );

  const notificationsTab = (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">{t('settings.notificationSettings')}</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">{t('settings.desktopNotifications')}</label>
                <p className="text-xs text-gray-500 mt-1">{t('settings.desktopDescription')}</p>
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
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">{t('settings.notificationTypes')}</label>
              
              <div className="space-y-2">
                {[
                  { key: 'clientUpdates', label: t('settings.typeClientUpdates') },
                  { key: 'serverStatus', label: t('settings.typeServerStatus') },
                  { key: 'gameCrashes', label: t('settings.typeGameCrashes') },
                  { key: 'connectionIssues', label: t('settings.typeConnectionIssues') },
                  { key: 'launcherErrors', label: t('settings.typeLauncherErrors') },
                  { key: 'systemMessages', label: t('settings.typeSystemMessages') },
                ].map((type) => (
                  <div key={type.key} className="flex items-center justify-between">
                    <label className="text-sm text-gray-400">{type.label}</label>
                    <input
                      type="checkbox"
                      checked={settings.notifications?.[type.key as keyof typeof settings.notifications] ?? true}
                      onChange={(e) => settings.updateSettings({ 
                        notifications: { 
                          ...settings.notifications, 
                          [type.key]: e.target.checked 
                        } 
                      })}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">{t('settings.notificationSound')}</label>
                <p className="text-xs text-gray-500 mt-1">{t('settings.soundDescription')}</p>
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
                className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
      </section>
    </div>
  );

  const updatesTab = (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">{t('settings.updatesTitle')}</h2>
        <p className="text-xs text-gray-500 mb-4">{t('settings.updatesDescription')}</p>
        <UpdateCheckButton />
      </section>
    </div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">{t('settings.pageTitle')}</h1>
        <p className="text-gray-400">{t('settings.pageDescription')}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#6b8e23] text-white border border-[#7a9f35]/40 shadow-lg shadow-[#6b8e23]/20'
                    : 'bg-[#1f1f1f] border border-transparent text-gray-400 hover:text-white hover:border-[#3d3d3d]/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>{renderActiveTab()}</div>

        <div className="flex justify-between pt-4 border-t border-white/10">
          <button
            onClick={handleResetSettings}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all flex items-center gap-2"
          >
            <RotateCcw size={20} />
            <span>{t('settings.resetButton')}</span>
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all flex items-center gap-2"
          >
            <Save size={20} />
            <span>{t('settings.saveButton')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
