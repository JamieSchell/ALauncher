/**
 * Settings Page
 */

import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export default function SettingsPage() {
  const settings = useSettingsStore();

  const handleSave = () => {
    // Settings are auto-saved via zustand persist
    alert('Settings saved successfully!');
  };

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
              <input
                type="number"
                value={settings.ram}
                onChange={(e) => settings.updateSettings({ ram: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="512"
                max="16384"
                step="512"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 2048-4096 MB</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Window Width
                </label>
                <input
                  type="number"
                  value={settings.width}
                  onChange={(e) => settings.updateSettings({ width: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="800"
                  max="3840"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Window Height
                </label>
                <input
                  type="number"
                  value={settings.height}
                  onChange={(e) => settings.updateSettings({ height: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="600"
                  max="2160"
                />
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Java Executable Path
            </label>
            <input
              type="text"
              value={settings.javaPath}
              onChange={(e) => settings.updateSettings({ javaPath: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="/path/to/java"
            />
            <p className="text-xs text-gray-500 mt-1">Leave as 'java' to use system Java</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
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
