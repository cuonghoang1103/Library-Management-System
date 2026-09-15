import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Globe,
  Bell,
  BookOpen,
  Shield,
  Loader2,
  Check,
  X,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage, languages } = useI18n();
  const { darkMode, toggleDarkMode, setTheme } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState([]);
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
  });
  const [password, setPassword] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette },
    { id: 'language', label: t('settings.language'), icon: Globe },
    { id: 'notifications', label: t('settings.notificationSettings'), icon: Bell },
    { id: 'library', label: t('settings.librarySettings'), icon: BookOpen },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch settings');
    }
  };

  const handleSaveSetting = async (key, value) => {
    try {
      const res = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        toast.success(t('settings.saveSuccess'));
        fetchSettings();
      } else {
        toast.error(t('settings.saveError'));
      }
    } catch (err) {
      toast.error(t('errors.serverError'));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t('settings.saveSuccess'));
    } catch (err) {
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(t('settings.saveSuccess'));
      setPassword({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  };

  const themeOptions = [
    { id: 'light', label: t('settings.lightMode'), icon: Sun, color: 'from-yellow-400 to-orange-400' },
    { id: 'dark', label: t('settings.darkMode'), icon: Moon, color: 'from-indigo-600 to-purple-600' },
    { id: 'system', label: t('settings.systemDefault'), icon: Monitor, color: 'from-gray-400 to-gray-500' },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('common.description')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 sticky top-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('settings.myProfile')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.description')}</p>
                </div>

                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.fullName}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                    <span className="inline-flex mt-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {user?.role === 'LIBRARIAN' ? t('users.roles.librarian') : user?.role === 'ADMIN' ? t('users.roles.admin') : t('users.roles.member')}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('users.fullName')}
                      </label>
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('common.email')}
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('common.phone')}
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('settings.changePassword')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="password"
                        placeholder={t('settings.oldPassword')}
                        value={password.oldPassword}
                        onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })}
                        className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                      />
                      <input
                        type="password"
                        placeholder={t('settings.newPassword')}
                        value={password.newPassword}
                        onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                        className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                      />
                      <input
                        type="password"
                        placeholder={t('settings.confirmPassword')}
                        value={password.confirmPassword}
                        onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                        className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                      {t('common.save')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('settings.theme')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.appearance')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = (option.id === 'light' && !darkMode) || (option.id === 'dark' && darkMode) || (option.id === 'system' && !darkMode);
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          if (option.id === 'light') {
                            setTheme('light');
                          } else if (option.id === 'dark') {
                            setTheme('dark');
                          } else {
                            setTheme('system');
                          }
                        }}
                        className={`relative p-6 rounded-2xl border-2 transition-all ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-4 mx-auto`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <p className={`font-medium text-center ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {option.label}
                        </p>
                        {isActive && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('settings.language')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.language')}</p>
                </div>

                <div className="space-y-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        currentLanguage === lang.code
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${
                          currentLanguage === lang.code
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {lang.name}
                        </p>
                      </div>
                      {currentLanguage === lang.code && (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={16} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('settings.notificationSettings')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.notificationSettings')}</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'email_notification', label: 'Email Notifications', desc: 'Receive email notifications for important updates' },
                    { key: 'loan_reminder', label: 'Loan Reminders', desc: 'Get reminded before your loans are due' },
                    { key: 'overdue_alerts', label: 'Overdue Alerts', desc: 'Receive alerts when books are overdue' },
                    { key: 'reservation_updates', label: 'Reservation Updates', desc: 'Get notified when reservations are ready' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Library Settings Tab */}
            {activeTab === 'library' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('settings.librarySettings')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.loanSettings')}</p>
                </div>

                <div className="space-y-4">
                  {settings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <Shield size={48} className="mx-auto mb-4 opacity-30" />
                      <p>{t('common.noData')}</p>
                    </div>
                  ) : (
                    settings.map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          {setting.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                          )}
                        </div>
                        {setting.key.includes('enabled') ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={setting.value === 'true'}
                              onChange={(e) => handleSaveSetting(setting.key, e.target.checked.toString())}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                          </label>
                        ) : (
                          <input
                            type="text"
                            defaultValue={setting.value}
                            onBlur={(e) => handleSaveSetting(setting.key, e.target.value)}
                            className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
