import { useState, useEffect, useCallback } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Edit, Calendar, DollarSign, MapPin, Tag, User,
    Info, Hash, Monitor, Activity, Building, Cpu, HardDrive,
    MemoryStick, Laptop, Plus, Wrench, ChevronDown, ChevronUp, Trash2, ShieldCheck, Gauge
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Asset, ServiceLog } from '../../types';
import { getAssetById } from '../../config/assetService';
import { getServiceLogsByAsset, deleteServiceLog } from '../../services/serviceLogService';
import { isComputerCategory, isServiceableCategory } from '../../constants/assets';
import { formatDate, formatLKR } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AddServiceRecordModal from '../../components/common/AddServiceRecordModal';

const LONG_DATE: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

export default function AssetDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    usePageTitle(asset?.assetName ?? 'Asset Details');

    const isComputerAsset = isComputerCategory(asset?.category);
    const isServiceableAsset = isServiceableCategory(asset?.category);

    const fetchAsset = useCallback(async () => {
        if (!id) return;
        try {
            const data = await getAssetById(id);
            setAsset(data);
            setLoadError(false);
        } catch (error) {
            console.error('Failed to load asset', error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchServiceLogs = useCallback(async () => {
        if (!id) return;
        try {
            const logs = await getServiceLogsByAsset(id);
            setServiceLogs(logs);
        } catch (error) {
            console.error('Failed to load service logs', error);
            toast.error('Failed to load service history');
        }
    }, [id]);

    useEffect(() => {
        fetchAsset();
    }, [fetchAsset]);

    useEffect(() => {
        if (isServiceableAsset) {
            fetchServiceLogs();
        }
    }, [isServiceableAsset, fetchServiceLogs]);

    const handleServiceAdded = async () => {
        setShowModal(false);
        // The record may have moved the asset's next service date
        await Promise.all([fetchServiceLogs(), fetchAsset()]);
    };

    const handleDeleteLog = async (log: ServiceLog) => {
        if (!confirm(`Delete service record "${log.serviceType}" from ${formatDate(log.serviceDate)}?`)) return;
        try {
            await deleteServiceLog(log.id, log);
            toast.success('Service record deleted.');
            setServiceLogs(prev => prev.filter(l => l.id !== log.id));
        } catch {
            toast.error('Failed to delete service record.');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-blue-500 text-white shadow-lg shadow-blue-500/30';
            case 'Assigned': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30';
            case 'Under Repair': return 'bg-[#F29100] text-white shadow-lg shadow-[#F29100]/30';
            case 'Retired': return 'bg-red-500 text-white shadow-lg shadow-red-500/30';
            default: return 'bg-gray-500 text-white shadow-lg shadow-gray-500/30';
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="text-center py-20 glass-card rounded-3xl max-w-2xl mx-auto mt-10">
                <div className="bg-slate-100/50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Monitor className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{loadError ? 'Could not load this asset' : 'Asset not found'}</h3>
                <p className="text-slate-500 mt-2 mb-6">
                    {loadError
                        ? 'The inventory could not be reached. Check your connection and try again.'
                        : 'The asset you are looking for does not exist or has been removed.'}
                </p>
                <div className="flex justify-center gap-3">
                    {loadError && (
                        <button
                            type="button"
                            onClick={() => {
                                setLoading(true);
                                fetchAsset();
                            }}
                            className="rounded-xl bg-white border border-slate-200 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Try again
                        </button>
                    )}
                    <Link to="/assets" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-2.5 rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-medium shadow-md">
                        <ArrowLeft className="h-4 w-4" />
                        Return to inventory
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in-up">
            {/* Premium Header Banner */}
            <div className="bg-gradient-to-br from-[#005500] via-[#004400] to-emerald-900 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-20 w-48 h-48 bg-[#FDB913] opacity-10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-start gap-8">
                    <Link to="/assets" className="inline-flex items-center gap-2 text-emerald-100/80 hover:text-white transition-all text-sm font-semibold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 hover:border-white/20">
                        <ArrowLeft className="h-4 w-4" /> Back to Inventory
                    </Link>

                    <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{asset.assetName}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${getStatusBadge(asset.status)}`}>
                                    {(asset.status || 'Unknown').toUpperCase()}
                                </span>
                                <span className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-emerald-50 text-sm font-medium flex items-center gap-2 shadow-inner">
                                    <Tag className="h-3.5 w-3.5 text-emerald-300" /> Ref: {asset.refNumber}
                                </span>
                                <span className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-emerald-50 text-sm font-medium flex items-center gap-2 shadow-inner">
                                    <Hash className="h-3.5 w-3.5 text-emerald-300" /> SN: {asset.serialNumber || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <Link
                                to={`/assets/edit/${asset.id}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-6 py-3 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-emerald-900/50"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Asset
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Columns */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Device Specifications */}
                    <div className="glass-card rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="px-8 py-6 border-b border-slate-100/50 flex items-center gap-4 bg-gradient-to-r from-emerald-50/50 to-transparent">
                            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl text-emerald-700 shadow-sm transform group-hover:scale-110 transition-transform">
                                <Monitor className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Device Specifications</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                            <InfoRow icon={Tag} label="Category" value={asset.category} />
                            <InfoRow icon={Info} label="Brand & Model" value={[asset.brand, asset.model].filter(Boolean).join(' ') || 'N/A'} />
                            <InfoRow icon={Hash} label="Serial Number" value={asset.serialNumber || 'N/A'} mono />
                            <InfoRow icon={Hash} label="Internal Reference" value={asset.refNumber} mono />
                            <InfoRow icon={Gauge} label="Condition" value={asset.condition || 'Not recorded'} />
                        </div>
                    </div>

                    {/* Laptop/Desktop Specs Card */}
                    {isComputerAsset && (asset.processorType || asset.ram || asset.storage || asset.os) && (
                        <div className="glass-card rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            <div className="px-8 py-6 border-b border-slate-100/50 flex items-center gap-4 bg-gradient-to-r from-purple-50/50 to-transparent">
                                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl text-purple-700 shadow-sm transform group-hover:scale-110 transition-transform">
                                    <Laptop className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Hardware Specifications</h3>
                            </div>
                            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                                {asset.processorType && <InfoRow icon={Cpu} label="Processor" value={asset.processorType} />}
                                {asset.ram && <InfoRow icon={MemoryStick} label="RAM" value={asset.ram} />}
                                {asset.storage && <InfoRow icon={HardDrive} label="Storage" value={asset.storage} />}
                                {asset.os && <InfoRow icon={Monitor} label="Operating System" value={asset.os} />}
                            </div>
                        </div>
                    )}

                    {/* Financial Data */}
                    <div className="glass-card rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="px-8 py-6 border-b border-slate-100/50 flex items-center gap-4 bg-gradient-to-r from-orange-50/50 to-transparent">
                            <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl text-[#F29100] shadow-sm transform group-hover:scale-110 transition-transform">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Financial Data</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                            <div>
                                <dt className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Unit Price</dt>
                                <dd className="text-3xl font-extrabold text-[#005500] drop-shadow-sm">
                                    {formatLKR(asset.unitPrice)}
                                </dd>
                            </div>
                            {asset.quantity > 1 && (
                                <InfoRow icon={DollarSign} label={`Total Value (${asset.quantity} units)`} value={formatLKR(asset.totalValue)} />
                            )}
                            <InfoRow icon={Calendar} label="Purchase Date" value={formatDate(asset.purchaseDate, LONG_DATE) || 'Unknown'} />
                            <InfoRow icon={ShieldCheck} label="Warranty End" value={formatDate(asset.warrantyEnd, LONG_DATE) || 'Unknown'} />
                            {asset.nextServiceDate && (
                                <InfoRow icon={Calendar} label="Next Service Date" value={formatDate(asset.nextServiceDate, LONG_DATE)} highlight />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8 lg:col-span-1">
                    <div className="glass-panel bg-gradient-to-b from-white/60 to-slate-50/30 rounded-3xl overflow-hidden relative hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none"></div>

                        <div className="px-8 py-6 border-b border-slate-200/50 flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl text-blue-600 shadow-sm transform group-hover:scale-110 transition-transform">
                                <User className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Allocation</h3>
                        </div>
                        <div className="p-8 space-y-8 relative z-10">
                            <InfoRow icon={User} label="Assigned To" value={asset.assignedTo || 'Unassigned'} highlight />
                            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-full" />
                            <InfoRow icon={Building} label="Department" value={asset.department || 'Not Specified'} />
                            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-full" />
                            <InfoRow icon={MapPin} label="Location" value={asset.location || 'Unknown'} />
                            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-full" />
                            <InfoRow icon={Activity} label="Remarks" value={asset.remarks || 'No remarks added.'} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Service History Section — Serviceable Assets only */}
            {isServiceableAsset && (
                <div className="glass-card rounded-3xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100/50 flex flex-wrap gap-4 items-center justify-between bg-gradient-to-r from-teal-50/50 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl text-teal-700 shadow-sm">
                                <Wrench className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Service History</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{serviceLogs.length} record{serviceLogs.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:scale-105 hover:shadow-xl transition-all duration-300"
                        >
                            <Plus className="h-4 w-4" />
                            Add Service Record
                        </button>
                    </div>

                    {serviceLogs.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="bg-slate-50/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wrench className="h-8 w-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">No service records yet</p>
                            <p className="text-slate-400 text-sm mt-1">Click "Add Service Record" to log the first service.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100/50">
                            {serviceLogs.map(log => (
                                <div key={log.id} className="px-8 py-5 hover:bg-slate-50/50 transition-colors">
                                    {/* Collapsed Header Row */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="flex-shrink-0 mt-1 p-2 bg-teal-50 rounded-xl">
                                                <Wrench className="h-4 w-4 text-teal-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="font-semibold text-slate-900">{log.serviceType}</span>
                                                    <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium border border-teal-100">
                                                        {formatDate(log.serviceDate)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500 flex-wrap">
                                                    {log.technicianName && <span>👤 {log.technicianName}</span>}
                                                    {typeof log.serviceCost === 'number' && log.serviceCost > 0 && (
                                                        <span>💰 {formatLKR(log.serviceCost)}</span>
                                                    )}
                                                    {log.nextServiceDate && (
                                                        <span className="text-amber-600">🔔 Next: {formatDate(log.nextServiceDate)}</span>
                                                    )}
                                                </div>
                                                {log.remarks && (
                                                    <p className="text-sm text-slate-500 mt-1 italic">"{log.remarks}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                                title="View details"
                                                aria-label={expandedLog === log.id ? 'Hide service details' : 'Show service details'}
                                                aria-expanded={expandedLog === log.id}
                                            >
                                                {expandedLog === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLog(log)}
                                                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                title="Delete record"
                                                aria-label="Delete service record"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedLog === log.id && (
                                        <div className="mt-4 ml-12 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                                            {log.serviceDetails && (
                                                <div className="sm:col-span-2">
                                                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Service Details</dt>
                                                    <dd className="text-sm text-slate-700">{log.serviceDetails}</dd>
                                                </div>
                                            )}
                                            {log.partsReplaced && (
                                                <div>
                                                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Parts Replaced</dt>
                                                    <dd className="text-sm text-slate-700">{log.partsReplaced}</dd>
                                                </div>
                                            )}
                                            {log.serviceProvider && (
                                                <div>
                                                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Service Provider</dt>
                                                    <dd className="text-sm text-slate-700">{log.serviceProvider}</dd>
                                                </div>
                                            )}
                                            {!log.serviceDetails && !log.partsReplaced && !log.serviceProvider && (
                                                <p className="text-sm text-slate-500 sm:col-span-2">No further details recorded.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Service Record Modal */}
            {showModal && (
                <AddServiceRecordModal
                    asset={{ id: asset.id, assetName: asset.assetName, category: asset.category }}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleServiceAdded}
                />
            )}
        </div>
    );
}

// Helper component for consistent info rows
function InfoRow({ icon: Icon, label, value, mono = false, highlight = false }: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: ReactNode;
    mono?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className="group/row">
            <dt className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2 uppercase tracking-wider group-hover/row:text-emerald-600 transition-colors">
                <Icon className="h-4 w-4 opacity-70" />
                {label}
            </dt>
            <dd className={`text-base ${highlight ? 'text-blue-700 font-bold text-xl' : 'text-slate-900 font-semibold text-lg'} ${mono ? 'font-mono bg-slate-100/50 px-3 py-1.5 inline-block rounded-lg border border-slate-200 text-sm shadow-inner' : ''}`}>
                {value}
            </dd>
        </div>
    );
}
