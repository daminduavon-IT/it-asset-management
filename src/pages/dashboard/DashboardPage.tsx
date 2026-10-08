import { useEffect, useState } from 'react';
import {
    MonitorSmartphone,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Calendar,
    ArrowRight,
    RotateCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { AssetStatus, DashboardStats } from '../../types';
import { getDashboardStats } from '../../config/assetService';
import { usePageTitle } from '../../hooks/usePageTitle';
import { formatDate, parseDate, startOfToday } from '../../utils/format';
import toast from 'react-hot-toast';

// Chart Colors based on brand and standard dashboard colors — enough distinct colours for the master sheet's categories/locations
const CATEGORY_COLORS = ['#005500', '#F29100', '#FDB913', '#059669', '#3b82f6', '#8b5cf6', '#f43f5e', '#0ea5e9', '#a16207', '#64748b', '#ec4899', '#14b8a6'];
const LOCATION_COLORS = ['#3f6212', '#F29100', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#64748b', '#a855f7'];

// All Assets, pre-filtered to the card's status
const assetsLink = (status?: AssetStatus) => (status ? `/assets?${new URLSearchParams({ status })}` : '/assets');

export default function DashboardPage() {
    usePageTitle('Dashboard');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            setLoadError(true);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const statCards = [
        { name: 'Total IT Assets', value: stats?.totalAssets || 0, icon: MonitorSmartphone, color: 'bg-primary-500', to: assetsLink() },
        { name: 'Assigned to Staff', value: stats?.assignedAssets || 0, icon: CheckCircle2, color: 'bg-emerald-500', to: assetsLink('Assigned') },
        { name: 'Available in Stock', value: stats?.availableAssets || 0, icon: Clock, color: 'bg-blue-500', to: assetsLink('Available') },
        { name: 'Under Repair', value: stats?.underRepair || 0, icon: AlertTriangle, color: 'bg-amber-500', to: assetsLink('Under Repair') },
    ];

    const today = startOfToday();
    const isOverdue = (date?: string | null) => {
        const parsed = parseDate(date);
        return parsed !== null && parsed < today;
    };
    const overdueCount = stats?.serviceReminders.filter(asset => isOverdue(asset.nextServiceDate)).length ?? 0;
    const dueSoonCount = (stats?.serviceReminders.length ?? 0) - overdueCount;

    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Real-time metrics for Avon Pharmo Chem IT assets.
                </p>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : loadError ? (
                <div role="alert" className="glass-card rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                    <h3 className="text-base font-semibold text-slate-900">Dashboard data could not be loaded</h3>
                    <p className="text-sm text-slate-500">Figures are hidden rather than shown as zero. Check your connection and try again.</p>
                    <button
                        onClick={fetchStats}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
                    >
                        <RotateCw className="h-4 w-4" />
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
                        {statCards.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.to}
                                    aria-label={`${item.name}: ${item.value}. View the list`}
                                    className="relative block overflow-hidden rounded-2xl glass-card px-4 pb-12 pt-5 sm:px-6 sm:pt-6 group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                >
                                    <div>
                                        <div className={`absolute rounded-xl p-3 bg-gradient-to-br ${
                                            item.color === 'bg-primary-500' ? 'from-blue-500 to-indigo-600 shadow-blue-500/30' :
                                            item.color === 'bg-emerald-500' ? 'from-emerald-400 to-teal-600 shadow-emerald-500/30' :
                                            item.color === 'bg-blue-500' ? 'from-cyan-400 to-blue-600 shadow-cyan-500/30' :
                                            'from-amber-400 to-orange-500 shadow-amber-500/30'
                                        } shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </div>
                                        <p className="ml-16 truncate text-sm font-medium text-slate-500">
                                            {item.name}
                                        </p>
                                    </div>
                                    <div className="ml-16 flex items-baseline pb-6 sm:pb-7">
                                        <p className="text-3xl font-extrabold text-slate-900">
                                            {item.value}
                                        </p>
                                    </div>
                                    <span className="absolute bottom-4 left-4 sm:left-6 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-emerald-700 transition-colors">
                                        View list
                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        {/* Assets by Category */}
                        <div className="glass-card rounded-3xl p-6 flex flex-col">
                            <h3 className="text-base font-bold leading-6 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
                                Assets by Category
                            </h3>
                            <div className="flex-1 min-h-[350px] sm:min-h-[300px] w-full relative">
                                {stats && Object.keys(stats.byCategory).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="40%"
                                                innerRadius={50}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {Object.entries(stats.byCategory).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} Assets`, 'Count']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={80}
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '12px', paddingTop: '20px', lineHeight: '20px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                                        No category data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assets by Location */}
                        <div className="glass-card rounded-3xl p-6 flex flex-col">
                            <h3 className="text-base font-bold leading-6 text-slate-800 mb-6 border-b border-slate-200/50 pb-4">
                                Assets by Location
                            </h3>
                            <div className="flex-1 min-h-[350px] sm:min-h-[300px] w-full relative">
                                {stats && Object.keys(stats.byLocation).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(stats.byLocation).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="40%"
                                                innerRadius={50}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {Object.entries(stats.byLocation).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} Assets`, 'Count']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={80}
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '12px', paddingTop: '20px', lineHeight: '20px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                                        No location data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Service Reminders */}
                    {stats?.serviceReminders && stats.serviceReminders.length > 0 && (
                        <div className="glass-card rounded-3xl p-6 flex flex-col border-orange-200/50 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="flex flex-wrap items-center gap-3 mb-6 border-b border-slate-200/50 pb-4">
                                <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl shadow-lg shadow-orange-500/20">
                                    <AlertTriangle className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold leading-6 text-slate-900">
                                    Upcoming Service Reminders
                                </h3>
                                <div className="ml-auto flex gap-2">
                                    {overdueCount > 0 && (
                                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                            {overdueCount} Overdue
                                        </span>
                                    )}
                                    {dueSoonCount > 0 && (
                                        <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                            {dueSoonCount} Due Soon
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stats.serviceReminders.map(asset => {
                                    const overdue = isOverdue(asset.nextServiceDate);
                                    return (
                                        <Link key={asset.id} to={`/assets/${asset.id}`} className="block">
                                            <div className={`border border-slate-200/60 bg-white/40 rounded-2xl p-4 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 ${overdue ? 'hover:border-red-400 hover:bg-red-50/50' : 'hover:border-orange-400 hover:bg-orange-50/50'}`}>
                                                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${overdue ? 'from-red-500 to-red-700' : 'from-orange-400 to-red-500'}`}></div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-gray-900 truncate pr-4">{asset.assetName}</h4>
                                                        <p className="text-xs text-gray-500">{asset.refNumber}</p>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100/50">
                                                    <Calendar className={`h-4 w-4 ${overdue ? 'text-red-600' : 'text-orange-500'}`} />
                                                    <span className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-orange-600'}`}>
                                                        {overdue ? 'Overdue since' : 'Due:'} {formatDate(asset.nextServiceDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
