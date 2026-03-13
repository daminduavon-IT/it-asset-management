import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Activity, LogIn, Clock, Shield, Monitor, Globe } from 'lucide-react';

interface LoginLog {
    id: string;
    uid: string;
    userName: string;
    email: string;
    loginTime: any;
    logoutTime: any;
    loginStatus: string;
    sessionId: string;
    browser: string;
    os: string;
    deviceInfo: string;
}

interface ActivityLog {
    id: string;
    uid: string;
    userName: string;
    email: string;
    action: string;
    module: string;
    recordId: string;
    recordName: string;
    timestamp: any;
    changedFields?: string[];
}

export default function LogsPage() {
    const [activeTab, setActiveTab] = useState<'login' | 'activity'>('login');
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [activeTab]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            if (activeTab === 'login') {
                const q = query(collection(db, 'login_logs'), orderBy('loginTime', 'desc'), limit(100));
                const snapshot = await getDocs(q);
                setLoginLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginLog)));
            } else {
                const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(100));
                const snapshot = await getDocs(q);
                setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

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
                <nav className="-mb-px flex space-x-8">
                    <button
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
                                                <span className="flex items-center"><Globe className="mr-1.5 h-3 w-3" /> {log.browser}</span>
                                                <span className="flex items-center"><Monitor className="mr-1.5 h-3 w-3" /> {log.os}</span>
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
                                {activityLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-l-4" 
                                            style={{ borderLeftColor: 
                                                log.action === 'CREATE' ? '#10B981' : 
                                                log.action === 'DELETE' ? '#EF4444' : 
                                                log.action === 'ASSIGN' ? '#3B82F6' :
                                                log.action === 'TRANSFER' ? '#8B5CF6' : '#F59E0B' 
                                            }}>
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
                                            <div className="text-xs text-gray-500">ID: {log.recordId.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {log.changedFields?.length ? (
                                                <span title={log.changedFields.join(', ')}>
                                                    {log.changedFields.join(', ')}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
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
