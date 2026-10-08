import { useState, useEffect } from 'react';
import { Activity, LogIn, Clock, Shield, Monitor, Globe, RotateCw } from 'lucide-react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDateTime as formatDate } from '../../utils/format';
import type { ActivityLog, LoginLog } from '../../types';

const ACTION_COLORS: Record<string, string> = {
    CREATE: '#10B981',
    IMPORT: '#10B981',
    DELETE: '#EF4444',
    ASSIGN: '#3B82F6',
    TRANSFER: '#8B5CF6',
};

const latest = async <T,>(collectionName: string, timeField: string) => {
    const snapshot = await getDocs(query(collection(db, collectionName), orderBy(timeField, 'desc'), limit(100)));
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as T);
};

const changedFieldsText = (changedFields: ActivityLog['changedFields']) =>
    Array.isArray(changedFields) && changedFields.length > 0 ? changedFields.join(', ') : '';

export default function LogsPage() {
    usePageTitle('Audit Logs');
    const [activeTab, setActiveTab] = useState<'login' | 'activity'>('login');
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let ignore = false;

        const fetchLogs = async () => {
            setLoading(true);
            setLoadError(false);
            try {
                if (activeTab === 'login') {
                    const data = await latest<LoginLog>('login_logs', 'loginTime');
                    if (!ignore) setLoginLogs(data);
                } else {
                    const data = await latest<ActivityLog>('activity_logs', 'timestamp');
                    if (!ignore) setActivityLogs(data);
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
                if (!ignore) setLoadError(true);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchLogs();
        return () => {
            ignore = true;
        };
    }, [activeTab, reloadKey]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Shield className="mr-2 h-6 w-6 text-[#005500]" />
                    System Audit Logs
                </h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'login'}
                        onClick={() => setActiveTab('login')}
                        className={`${
                            activeTab === 'login'
                                ? 'border-[#005500] text-[#005500]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } flex whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        <LogIn className="mr-2 h-5 w-5" />
                        Login History
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'activity'}
                        onClick={() => setActiveTab('activity')}
                        className={`${
                            activeTab === 'activity'
                                ? 'border-[#005500] text-[#005500]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } flex whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        <Activity className="mr-2 h-5 w-5" />
                        System Activity
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading logs...</div>
                ) : loadError ? (
                    <div role="alert" className="p-8 text-center space-y-3">
                        <p className="text-sm text-gray-700">Failed to load logs. Check your connection and try again.</p>
                        <button
                            onClick={() => setReloadKey(key => key + 1)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#005500] px-4 py-2 text-sm font-semibold text-white"
                        >
                            <RotateCw className="h-4 w-4" />
                            Try again
                        </button>
                    </div>
                ) : activeTab === 'login' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logout Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device & OS</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loginLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-[#005500] flex items-center justify-center text-white font-bold">
                                                    {log.userName?.charAt(0) || 'U'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                                    <div className="text-sm text-gray-500">{log.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                log.loginStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {log.loginStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                                                {formatDate(log.loginTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(log.logoutTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col space-y-1">
                                                <span className="flex items-center"><Globe className="mr-1.5 h-3 w-3" /> {log.browser || '-'}</span>
                                                <span className="flex items-center"><Monitor className="mr-1.5 h-3 w-3" /> {log.os || '-'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {loginLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No login logs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activityLogs.map((log) => {
                                    const changes = changedFieldsText(log.changedFields);
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-l-4"
                                                style={{ borderLeftColor: ACTION_COLORS[log.action] ?? '#F59E0B' }}
                                            >
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                                <div className="text-sm text-gray-500">{log.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">{log.recordName}</div>
                                                <div className="text-xs text-gray-500">ID: {log.recordId?.substring(0, 8)}...</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                {changes || log.reason ? (
                                                    <span title={[changes, log.reason].filter(Boolean).join(' — ')}>
                                                        {[changes, log.reason].filter(Boolean).join(' — ')}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {activityLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No activity logs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
