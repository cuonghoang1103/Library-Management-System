import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { reservationsApi } from '../services/api';
import { Bell, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyReservations() {
  const { t } = useTranslation();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationsApi.getMyReservations();
      setReservations(res.data.data || []);
    } catch (err) {
      toast.error(t('reservations.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId) => {
    if (!confirm(t('reservations.confirmCancel'))) return;
    
    try {
      await reservationsApi.cancel(reservationId);
      toast.success(t('reservations.cancelSuccess'));
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || t('reservations.cancelFailed'));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING':
        return <Clock size={16} className="text-yellow-500" />;
      case 'READY':
        return <Bell size={16} className="text-blue-500" />;
      case 'FULFILLED':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'CANCELLED':
        return <XCircle size={16} className="text-gray-500" />;
      case 'EXPIRED':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WAITING':
        return 'badge-warning';
      case 'READY':
        return 'badge-info';
      case 'FULFILLED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-info';
      case 'EXPIRED':
        return 'badge-danger';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeReservations = reservations.filter(r => 
    r.status === 'WAITING' || r.status === 'READY'
  );
  const pastReservations = reservations.filter(r => 
    r.status === 'FULFILLED' || r.status === 'CANCELLED' || r.status === 'EXPIRED'
  );

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reservations.pageTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {activeReservations.length > 0
            ? `${activeReservations.length} ${t('reservations.activeReservations')}${activeReservations.length > 1 ? t('reservations.plural') : ''}`
            : t('reservations.noActive')
          }
        </p>
      </div>

      {/* Active Reservations */}
      {activeReservations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('reservations.activeReservations')}</h2>
          {activeReservations.map((reservation) => (
            <div
              key={reservation.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border p-5 ${
                reservation.status === 'READY'
                  ? 'border-blue-200 dark:border-blue-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    reservation.status === 'READY'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    <Bell size={24} className={reservation.status === 'READY' ? 'text-blue-600' : 'text-yellow-600'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {reservation.bookTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className={`badge ${getStatusBadge(reservation.status)}`}>
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1">{reservation.status}</span>
                      </span>
                    {reservation.status === 'WAITING' && reservation.position && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('reservations.positionInQueue', { position: reservation.position })}
                      </span>
                    )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {reservation.expiresAt && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={14} />
                      {reservation.status === 'READY' ? t('reservations.pickupBy') : t('reservations.expires')}
                    </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(reservation.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {reservation.status !== 'READY' && (
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <XCircle size={16} />
                      {t('common.cancel')}
                    </button>
                  )}

                  {reservation.status === 'READY' && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {t('reservations.pickupAtLibrary')}
                    </div>
                  )}
                </div>
              </div>

                {/* Ready notification message */}
                {reservation.status === 'READY' && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {t('reservations.readyMessage', { days: reservation.expiresAt ? Math.ceil((new Date(reservation.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : 3 })}
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('reservations.pastReservations')}</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">{t('books.book')}</th>
                  <th className="px-4 py-3 text-left">{t('reservations.status')}</th>
                  <th className="px-4 py-3 text-left">{t('reservations.reservedDate')}</th>
                </tr>
              </thead>
              <tbody>
                {pastReservations.map((reservation) => (
                  <tr key={reservation.id} className="table-row">
                    <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                      {reservation.bookTitle}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${getStatusBadge(reservation.status)}`}>
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1">{reservation.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(reservation.reservedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reservations.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('reservations.noReservations')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {t('reservations.noReservationsDescription')}
          </p>
        </div>
      )}
    </div>
  );
}
