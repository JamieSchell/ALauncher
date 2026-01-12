/**
 * Settings Page - Functionality Only
 */

import { Save, Search, Loader2, FolderOpen, RotateCcw, SlidersHorizontal, Cpu, Bell, RefreshCw, Settings as SettingsIcon, Monitor, Volume2 } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import UpdateCheckButton from '../components/UpdateCheckButton';
import React, { useMemo, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { platformAPI, isElectron, isTauri } from '../api/platformSimple';
import { open } from '@tauri-apps/plugin-dialog';
import { useToastContext } from '../providers/ToastProvider';
import { Card, Button, Input } from '../components/ui';
import { tauriApi } from '../api/tauri';

// Simple Toggle Component
const Toggle = ({ checked, onChange, defaultChecked = false }: { checked?: boolean, onChange?: (checked: boolean) => void, defaultChecked?: boolean }) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = checked !== undefined ? checked : internalChecked;
  
  const handleClick = () => {
    const newValue = !isChecked;
    if (checked === undefined) {
      setInternalChecked(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 border ${isChecked ? 'bg-techno-cyan/20 border-techno-cyan' : 'bg-dark-primary border-gray-700'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 ${isChecked ? 'translate-x-6 bg-techno-cyan shadow-[0_0_10px_#00F5FF]' : 'translate-x-0 bg-gray-500'}`} />
    </button>
  );
};

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo, showWarning } = useToastContext();
  const [detectingJava, setDetectingJava] = useState(false);
  const [javaDetections, setJavaDetections] = useState<Array<{ path: string; version: string; major: number }>>([]);
  const [showJavaList, setShowJavaList] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'java' | 'notifications' | 'updates'>('general');

  const handleSave = async () => {
    await showSuccess(t('settings.saveSuccess'));
  };

  const handleAutoDetectJava = async () => {
    if (!isTauri && !isElectron) {
      await showError('This feature is only available in the desktop app.');
      return;
    }

    setDetectingJava(true);
    setShowJavaList(false);
    try {
      const result = await platformAPI.findJavaInstallations();
      if (result.success && result.installations.length > 0) {
        setJavaDetections(result.installations);
        setShowJavaList(true);
      } else {
        await showInfo(t('settings.autoDetectNoJava'));
      }
    } catch (error: any) {
      await showError(`${t('settings.autoDetectFail')}: ${error.message}`);
    } finally {
      setDetectingJava(false);
    }
  };

  const handleSelectJava = (javaPath: string) => {
    settings.updateSettings({ javaPath });
    setShowJavaList(false);
  };

  const handleBrowseJava = async () => {
    if (!isTauri && !isElectron) {
      await showError(t('errors.unknownError'));
      return;
    }

    if (isTauri) {
      try {
        const selectedPath = await open({
          multiple: false,
          filters: [{
            name: 'Java executable',
            extensions: ['exe', 'bin']
          }]
        });

        if (selectedPath) {
          const javaPath = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
          settings.updateSettings({ javaPath });
          await showSuccess(`${t('settings.javaPathLabel')}: ${javaPath}`);
        }
      } catch (error: any) {
        await showError(`${t('settings.browseFail')}: ${error.message}`);
      }
    } else if (isElectron) {
      try {
        const result = await (window as any).electronAPI.selectJavaFile();
        if (result.success && result.path) {
          settings.updateSettings({ javaPath: result.path });
          await showSuccess(`${t('settings.javaPathLabel')}: ${result.path}\n${t('common.version') ?? 'Version'}: ${result.version || 'unknown'}`);
        } else if (!result.canceled) {
          await showError(result.error || t('settings.browseFail'));
        }
      } catch (error: any) {
        await showError(`${t('settings.browseFail')}: ${error.message}`);
      }
    }
  };

  const handleResetSettings = async () => {
    const confirmed = await tauriApi.showConfirmDialog({
      title: 'ALauncher - Confirm Reset',
      message: t('settings.resetConfirm'),
      type: 'warning',
    });
    
    if (confirmed) {
      settings.resetSettings();
      await showSuccess(t('settings.resetSuccess'));
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
    { id: 'general', label: t('settings.tabs.general') || 'General', icon: SettingsIcon },
    { id: 'java', label: t('settings.tabs.java') || 'Java & Memory', icon: Cpu },
    { id: 'GAME', label: t('settings.tabs.game') || 'Video & Graphics', icon: Monitor },
    { id: 'AUDIO', label: t('settings.tabs.audio') || 'Audio System', icon: Volume2 },
  ], [t]);

  const generalTab = (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-6">
        <h3 className="text-techno-cyan font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">{t('settings.launcherBehavior')}</h3>
        
        <div className="flex items-center justify-between p-4 bg-dark-panel rounded border border-white/5">
          <div>
            <div className="text-white font-bold text-xs">{t('settingsLabels.keepLauncherOpen')}</div>
            <div className="text-gray-500 text-xs">{t('settings.keepLauncherOpenDesc') || 'Do not close window after game start'}</div>
          </div>
          <Toggle defaultChecked={false} />
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-panel rounded border border-white/5">
          <div>
            <div className="text-white font-bold text-xs">{t('settingsLabels.discordRichPresence')}</div>
            <div className="text-gray-500 text-xs">{t('settings.discordRichPresenceDesc') || 'Show status on Discord profile'}</div>
          </div>
          <Toggle defaultChecked={true} />
        </div>
      </div>

    </div>
  );

  const javaTab = (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-6">
        <h3 className="text-magic-purple font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">{t('settingsLabels.memoryAllocation')}</h3>
        
        <div className="bg-dark-panel p-6 rounded border border-white/5">
          <div className="flex justify-between mb-4">
            <span className="text-gray-400">{t('ui.allocated')}</span>
            <span className="text-techno-cyan font-mono font-bold text-sm">{Math.round(settings.ram / 1024)} GB</span>
          </div>
          <input 
            type="range" 
            min="2" 
            max="16" 
            step="1"
            value={Math.round(settings.ram / 1024)}
            onChange={(e) => settings.updateSettings({ ram: parseInt(e.target.value) * 1024 })}
            className="w-full h-2 bg-dark-primary rounded-lg appearance-none cursor-pointer accent-techno-cyan hover:accent-magic-purple transition-all"
          />
          <div className="flex justify-between mt-2 text-xs text-gray-500 font-mono">
            <span>2 GB</span>
            <span>16 GB</span>
          </div>
          <p className="mt-4 text-xs text-status-warning flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-warning animate-pulse" />
            Warning: Allocating more than 8GB may cause garbage collection lag spikes.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-magic-purple font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">{t('settingsLabels.javaRuntime')}</h3>
        <Input 
          label={t('settings.javaPathLabel') || 'Java Executable Path'} 
          placeholder="Auto-detect (Recommended)"
          value={settings.javaPath || ''}
          onChange={(e) => settings.updateSettings({ javaPath: e.target.value })}
        />
        <Input 
          label="JVM Arguments" 
          placeholder="-Xmx4G -XX:+UseG1GC..."
        />
      </div>

      {showJavaList && javaDetections.length > 0 && (
        <div className="bg-dark-panel border border-white/5 rounded-lg p-6 mt-4">
          <h3 className="text-xs font-bold mb-4">{t('settings.foundJava') || 'Found Java Installations'}:</h3>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
            {javaDetections.map((java, index) => (
              <button
                key={index}
                onClick={() => handleSelectJava(java.path)}
                className={`w-full text-left p-3 rounded border transition-all ${
                  settings.javaPath === java.path
                    ? 'bg-techno-cyan/10 border-techno-cyan'
                    : 'bg-dark-primary border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">{java.path}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Java {java.version} (Major: {java.major})</div>
                  </div>
                  {settings.javaPath === java.path && (
                    <span className="text-xs bg-techno-cyan text-dark-primary px-2 py-1 rounded font-bold">
                      {t('settings.selectedLabel') || 'Selected'}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const notificationsTab = (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-6">
        <h3 className="text-techno-cyan font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">{t('settingsLabels.notificationSettings')}</h3>
        
        <div className="flex items-center justify-between p-4 bg-dark-panel rounded border border-white/5">
          <div>
            <div className="text-white font-bold text-xs">{t('settings.desktopNotifications') || 'Desktop Notifications'}</div>
            <div className="text-gray-500 text-xs">{t('settings.desktopDescription') || 'Show system notifications'}</div>
          </div>
          <Toggle 
            checked={settings.notifications?.desktop ?? true}
            onChange={(checked) => settings.updateSettings({
              notifications: {
                ...settings.notifications,
                desktop: checked
              }
            })}
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold">{t('settings.notificationTypes') || 'Notification Types'}</label>
          <div className="flex flex-col gap-3">
            {[
              { key: 'clientUpdates', label: t('settings.typeClientUpdates') || 'Client Updates' },
              { key: 'serverStatus', label: t('settings.typeServerStatus') || 'Server Status' },
              { key: 'gameCrashes', label: t('settings.typeGameCrashes') || 'Game Crashes' },
              { key: 'connectionIssues', label: t('settings.typeConnectionIssues') || 'Connection Issues' },
              { key: 'launcherErrors', label: t('settings.typeLauncherErrors') || 'Launcher Errors' },
              { key: 'systemMessages', label: t('settings.typeSystemMessages') || 'System Messages' },
            ].map((type) => (
              <div key={type.key} className="flex items-center justify-between p-3 bg-dark-panel rounded border border-white/5">
                <label className="text-xs cursor-pointer">{type.label}</label>
                <Toggle 
                  checked={settings.notifications?.[type.key as keyof typeof settings.notifications] ?? true}
                  onChange={(checked) => settings.updateSettings({
                    notifications: {
                      ...settings.notifications,
                      [type.key]: checked
                    }
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-panel rounded border border-white/5">
          <div>
            <div className="text-white font-bold text-xs">{t('settings.notificationSound') || 'Notification Sound'}</div>
            <div className="text-gray-500 text-xs">{t('settings.soundDescription') || 'Play sound for notifications'}</div>
          </div>
          <Toggle 
            checked={settings.notifications?.sound ?? true}
            onChange={(checked) => settings.updateSettings({
              notifications: {
                ...settings.notifications,
                sound: checked
              }
            })}
          />
        </div>
      </div>
    </div>
  );

  const updatesTab = (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
      <div className="w-16 h-16 rounded-full bg-dark-panel border border-white/10 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xs font-bold text-gray-400">{t('settings.updatesTitle') || 'Updates'}</h3>
      <p className="text-xs text-gray-600 max-w-xs">{t('settings.updatesDescription') || 'Check for launcher updates'}</p>
      <UpdateCheckButton />
    </div>
  );

  const gameTab = (
    <div className="space-y-8 animate-fade-in-up">
      <div className="space-y-6">
        <h3 className="text-status-success font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">{t('settingsLabels.resolution')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Width" 
            placeholder="1920"
            type="number"
            value={settings.width?.toString() || '1920'}
            onChange={(e) => settings.updateSettings({ width: parseInt(e.target.value) || 1920 })}
          />
          <Input 
            label="Height" 
            placeholder="1080"
            type="number"
            value={settings.height?.toString() || '1080'}
            onChange={(e) => settings.updateSettings({ height: parseInt(e.target.value) || 1080 })}
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-dark-panel rounded border border-white/5">
          <div>
            <div className="text-white font-bold text-xs">{t('settingsLabels.fullscreenMode')}</div>
            <div className="text-gray-500 text-xs">{t('settings.fullscreenModeDesc') || 'Start game in fullscreen'}</div>
          </div>
          <Toggle checked={settings.fullScreen} onChange={(checked) => settings.updateSettings({ fullScreen: checked })} />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-status-success font-bold uppercase tracking-wider text-xs border-b border-white/5 pb-2">{t('settingsLabels.optimization')}</h3>
        <div className="flex items-center justify-between p-4 bg-dark-panel rounded border border-white/5">
          <div>
            <div className="text-white font-bold text-xs">{t('settingsLabels.useOptimizationMods')}</div>
            <div className="text-gray-500 text-xs">{t('settings.useOptimizationModsDesc') || 'Injects Sodium/Lithium automatically'}</div>
          </div>
          <Toggle defaultChecked={true} />
        </div>
      </div>
    </div>
  );

  const audioTab = (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
      <div className="w-16 h-16 rounded-full bg-dark-panel border border-white/10 flex items-center justify-center">
        <Volume2 className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xs font-bold text-gray-400">{t('settingsLabels.audioSettings')}</h3>
      <p className="text-xs text-gray-600 max-w-xs">{t('settings.audioSettingsDesc') || 'Launcher sounds and notifications coming in v2.1 update.'}</p>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'java':
        return javaTab;
      case 'GAME':
        return gameTab;
      case 'AUDIO':
        return audioTab;
      case 'notifications':
        return notificationsTab;
      case 'updates':
        return updatesTab;
      default:
        return generalTab;
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveWithFeedback = () => {
    setIsSaving(true);
    handleSave();
    setTimeout(() => setIsSaving(false), 1500);
  };

  type TabType = 'general' | 'java' | 'notifications' | 'updates' | 'LAUNCHER' | 'JAVA' | 'GAME' | 'AUDIO';
  const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id as typeof activeTab)}
        className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all duration-200 text-left
          ${isActive 
            ? 'bg-techno-cyan/10 text-techno-cyan border-r-2 border-techno-cyan' 
            : 'text-gray-400 hover:bg-white/5 hover:text-white'}
        `}
      >
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-base font-display font-bold text-white mb-1">{t('settings.pageTitle')}</h1>
          <p className="text-gray-400 text-xs">{t('settings.pageDescription')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={handleResetSettings}>
            {t('settings.resetButton') || 'Defaults'}
          </Button>
          <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} isLoading={isSaving} onClick={handleSaveWithFeedback}>
            {t('settings.saveButton') || 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8">
        {/* Sidebar Tabs */}
        <div className="col-span-3 space-y-2">
          <Card className="h-full p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">{t('ui.categories')}</div>
            <TabButton id="general" icon={SettingsIcon} label={t('settings.tabs.general') || 'General'} />
            <TabButton id="java" icon={Cpu} label={t('settings.tabs.java') || 'Java & Memory'} />
            <TabButton id="GAME" icon={Monitor} label={t('settings.tabs.game') || 'Video & Graphics'} />
            <TabButton id="AUDIO" icon={Volume2} label={t('settings.tabs.audio') || 'Audio System'} />
          </Card>
        </div>

        {/* Content Area */}
        <div className="col-span-9">
          <Card className="h-full min-h-[500px]">
            {renderActiveTab()}
          </Card>
        </div>
      </div>
    </div>
  );
}
