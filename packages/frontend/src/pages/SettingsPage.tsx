/**
 * Settings Page
 */

import { motion } from 'framer-motion';
import { Save, Search, Loader2, FolderOpen, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import UpdateCheckButton from '../components/UpdateCheckButton';
import React, { useState } from 'react';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const [detectingJava, setDetectingJava] = useState(false);
  const [javaDetections, setJavaDetections] = useState<Array<{ path: string; version: string; major: number }>>([]);
  const [showJavaList, setShowJavaList] = useState(false);

  const handleSave = () => {
    // Settings are auto-saved via zustand persist
    alert('Settings saved successfully!');
  };

  const handleAutoDetectJava = async () => {
    if (!window.electronAPI) {
      alert('Electron API is not available');
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
        alert('No Java installations found. Please install Java or specify the path manually.');
      }
    } catch (error: any) {
      alert(`Failed to detect Java: ${error.message}`);
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
      alert('Electron API is not available');
      return;
    }

    try {
      const result = await window.electronAPI.selectJavaFile();
      if (result.success && result.path) {
        settings.updateSettings({ javaPath: result.path });
        alert(`Java selected: ${result.path}\nVersion: ${result.version || 'unknown'}`);
      } else if (!result.canceled) {
        alert(result.error || 'Failed to select Java file');
      }
    } catch (error: any) {
      alert(`Failed to browse for Java: ${error.message}`);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
      settings.resetSettings();
      alert('Settings have been reset to default values.');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your launcher preferences</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 space-y-6"
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Game Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                RAM Allocation (MB)
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
                Window Resolution
              </label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Width</label>
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
                    <label className="block text-xs text-gray-400 mb-1">Height</label>
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
                  <label className="block text-xs text-gray-400 mb-2">Quick Presets</label>
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
                Launch in fullscreen
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
                Auto-connect to server
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold text-white mb-4">Java Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Java Executable Path
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
                  title="Browse for Java executable"
                >
                  <FolderOpen size={18} />
                  <span>Browse</span>
                </button>
                <button
                  onClick={handleAutoDetectJava}
                  disabled={detectingJava || !window.electronAPI}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  title="Auto-detect Java installations"
                >
                  {detectingJava ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Auto-detect</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave as 'java' to use system Java, or click "Auto-detect" to find installed Java versions</p>
            </div>

            {showJavaList && javaDetections.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Found Java Installations:</h3>
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
                          <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded">Selected</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold text-white mb-4">Notification Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Desktop Notifications</label>
                <p className="text-xs text-gray-500 mt-1">Show desktop notifications for important events</p>
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
              <label className="text-sm font-medium text-gray-300">Notification Types</label>
              
              <div className="space-y-2">
                {[
                  { key: 'clientUpdates', label: 'Client Updates Available' },
                  { key: 'serverStatus', label: 'Server Status Changes' },
                  { key: 'gameCrashes', label: 'Game Crashes' },
                  { key: 'connectionIssues', label: 'Connection Issues' },
                  { key: 'launcherErrors', label: 'Launcher Errors' },
                  { key: 'systemMessages', label: 'System Messages' },
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
                <label className="text-sm font-medium text-gray-300">Notification Sound</label>
                <p className="text-xs text-gray-500 mt-1">Play sound when receiving notifications</p>
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
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">Launcher Updates</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Check for Updates
              </label>
              <p className="text-xs text-gray-500 mb-3">
                The launcher automatically checks for updates on startup. You can also check manually here.
              </p>
              <UpdateCheckButton />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button
            onClick={handleResetSettings}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all flex items-center gap-2"
          >
            <RotateCcw size={20} />
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all flex items-center gap-2"
          >
            <Save size={20} />
            <span>Save Settings</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
