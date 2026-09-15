import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('LOAN');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setSettings(data.data || []);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => prev.map(s => 
      s.settingKey === key ? { ...s, settingValue: value } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        await fetch(`http://localhost:8080/api/settings/${setting.settingKey}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ value: setting.settingValue })
        });
      }
      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['LOAN', 'FEE', 'RESERVATION', 'NOTIFICATION'];
  const categoryLabels = {
    LOAN: 'Loan Settings',
    FEE: 'Fee Settings',
    RESERVATION: 'Reservation Settings',
    NOTIFICATION: 'Notification Settings'
  };

  const filteredSettings = settings.filter(s => s.category === activeTab);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Library Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure library policies and behavior
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === category
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Settings List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {categoryLabels[activeTab]}
        </h2>

        <div className="space-y-6">
          {filteredSettings.map(setting => (
            <div key={setting.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900 dark:text-white block">
                  {setting.settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {setting.description}
                </p>
              </div>
              <div className="w-full md:w-48">
                {setting.settingKey.includes('enabled') ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.settingValue === 'true'}
                      onChange={(e) => updateSetting(setting.settingKey, e.target.checked ? 'true' : 'false')}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {setting.settingValue === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                ) : (
                  <input
                    type="text"
                    value={setting.settingValue}
                    onChange={(e) => updateSetting(setting.settingKey, e.target.value)}
                    className="input text-right"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchSettings}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Reset Changes
        </button>
      </div>
    </div>
  );
}
