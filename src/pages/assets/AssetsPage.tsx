import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Eye, Trash2, MonitorSmartphone, UploadCloud, Download, ChevronLeft, ChevronRight, AlertTriangle, RotateCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Asset, AssetInput } from '../../types';
import { getAssets, deleteAsset, bulkImportAssets, countServiceRecords } from '../../config/assetService';
import { STATUSES } from '../../constants/assets';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { usePageTitle } from '../../hooks/usePageTitle';
import importedAssets from '../../data/imported-assets.json';
import { useAuth } from '../../context/auth-context';

type Filters = { status: string; category: string; location: string };

const FILTER_SELECT_CLASS = 'mt-1 block w-full rounded-xl border-0 py-2 text-slate-900 bg-white/70 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm';

// Quote every cell, double embedded quotes, and stop Excel/Sheets from evaluating cells that start like a formula
const csvCell = (value: unknown) => {
    let cell = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
    return `"${cell.replace(/"/g, '""')}"`;
};

const distinctValues = (assets: Asset[], key: 'category' | 'location') =>
    [...new Set(assets.map(asset => asset[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export default function AssetsPage() {
    usePageTitle('All Assets');
    const { isAuditor } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // Filters live in the URL (?status=…&category=…&location=…) so the dashboard cards can link to a filtered list
    const [searchParams, setSearchParams] = useSearchParams();
    const filters: Filters = {
        status: searchParams.get('status') ?? '',
        category: searchParams.get('category') ?? '',
        location: searchParams.get('location') ?? ''
    };
    const [showFilters, setShowFilters] = useState(() => Object.values(filters).some(Boolean));
    const [importing, setImporting] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchAssets = async () => {
        try {
            setLoading(true);
            setLoadError(false);
            const data = await getAssets();
            setAssets(data);
        } catch (error) {
            console.error('Error fetching assets:', error);
            setLoadError(true);
            toast.error('Failed to load assets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleImport = async () => {
        if (window.confirm(`Are you sure you want to import ${importedAssets.length} assets from the CSV database?`)) {
            setImporting(true);
            try {
                await bulkImportAssets(importedAssets as unknown as AssetInput[]);
                toast.success(`Successfully imported all assets!`);
                fetchAssets();
            } catch (err) {
                console.error('Import failed', err);
                toast.error('Import failed. No assets were imported.');
            } finally {
                setImporting(false);
            }
        }
    };

    const handleDelete = async (asset: Asset) => {
        let serviceRecords = 0;
        try {
            serviceRecords = await countServiceRecords(asset.id);
        } catch (error) {
            console.error('Could not count service records:', error);
        }
        const historyNote = serviceRecords > 0
            ? `\n\nIts ${serviceRecords} service record${serviceRecords === 1 ? '' : 's'} will also be permanently deleted.`
            : '';

        if (window.confirm(`Are you sure you want to delete ${asset.assetName}? This action cannot be undone.${historyNote}`)) {
            try {
                await deleteAsset(asset.id);
                toast.success('Asset deleted successfully');
                fetchAssets();
            } catch (error) {
                console.error('Error deleting asset:', error);
                toast.error('Failed to delete asset');
            }
        }
    };

    const term = searchTerm.trim().toLowerCase();
    const filteredAssets = assets.filter(asset => {
        if (filters.status && asset.status !== filters.status) return false;
        if (filters.category && asset.category !== filters.category) return false;
        if (filters.location && asset.location !== filters.location) return false;
        if (!term) return true;
        return [asset.assetName, asset.refNumber, asset.serialNumber, asset.assignedTo, asset.category, asset.brand, asset.model, asset.location]
            .some(value => value?.toLowerCase().includes(term));
    });

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const updateFilter = (key: keyof Filters, value: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value);
            else next.delete(key);
            return next;
        }, { replace: true });
        setCurrentPage(1);
    };

    const handleExportCode = () => {
        try {
            const headers = ['Name', 'Ref Number', 'Serial Number', 'Category', 'Brand', 'Model', 'Status', 'Location', 'Assigned To'];
            const csvRows = [headers.map(csvCell).join(',')];

            for (const asset of filteredAssets) {
                csvRows.push([
                    asset.assetName,
                    asset.refNumber,
                    asset.serialNumber,
                    asset.category,
                    asset.brand,
                    asset.model,
                    asset.status,
                    asset.location,
                    asset.assignedTo
                ].map(csvCell).join(','));
            }

            // BOM so Excel opens the file as UTF-8 (Sinhala/Tamil names)
            const blob = new Blob(['﻿' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `it_assets_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            toast.success('Export successful!');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export assets');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-blue-100 text-blue-800';
            case 'Assigned': return 'bg-emerald-100 text-emerald-800';
            case 'Under Repair': return 'bg-amber-100 text-amber-800';
            case 'Retired': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Pagination logic — clamp so deleting the last row on the last page doesn't leave an empty page
    const totalPages = Math.max(1, Math.ceil(filteredAssets.length / itemsPerPage));
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * itemsPerPage;
    const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);
    const goToPage = (target: number) => setCurrentPage(Math.min(Math.max(1, target), totalPages));

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">IT Assets Inventory</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {filters.status ? (
                            <>Showing assets with status <span className="font-semibold text-slate-700">{filters.status}</span>.</>
                        ) : 'A comprehensive list of all company IT equipment.'}
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 flex flex-wrap items-center gap-3 justify-end">
                    {!isAuditor && !loading && !loadError && assets.length === 0 && ( /* Only show import if DB is confirmed empty to avoid duplicate imports */
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="inline-flex items-center gap-2 justify-center rounded-lg bg-white border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <UploadCloud className="h-4 w-4" />
                            {importing ? 'Importing...' : 'Import Master Sheet'}
                        </button>
                    )}
                    {assets.length > 0 && (
                        <button
                            onClick={handleExportCode}
                            className="inline-flex items-center gap-2 justify-center rounded-lg bg-white border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-all active:scale-95"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                    )}
                    {!isAuditor && (
                        <Link
                            to="/assets/add"
                            className="inline-flex items-center gap-2 justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            Add New Asset
                        </Link>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : loadError ? (
                <div role="alert" className="glass-card rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                    <h3 className="text-base font-semibold text-slate-900">Failed to load assets</h3>
                    <p className="text-sm text-slate-500">The inventory could not be reached. Check your connection and try again.</p>
                    <button
                        onClick={fetchAssets}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
                    >
                        <RotateCw className="h-4 w-4" />
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    <div className="glass-card p-4 rounded-2xl animate-fade-in-up space-y-4" style={{ animationDelay: '100ms' }}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="relative flex-1 max-w-md group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    aria-label="Search assets"
                                    className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-slate-900 bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all"
                                    placeholder="Search by name, ref no, serial or assignee..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Reset to first page when search changes
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(open => !open)}
                                aria-expanded={showFilters}
                                aria-controls="asset-filters"
                                className="inline-flex items-center gap-2 justify-center rounded-xl bg-white/50 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-white transition-all"
                            >
                                <Filter className="h-4 w-4 text-slate-500" />
                                More Filters
                                {activeFilterCount > 0 && (
                                    <span className="rounded-full bg-emerald-600 text-white text-xs px-2 py-0.5">{activeFilterCount}</span>
                                )}
                            </button>
                        </div>

                        {showFilters && (
                            <div id="asset-filters" className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end border-t border-slate-200/60 pt-4">
                                <label className="text-sm font-medium text-slate-700">
                                    Status
                                    <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className={FILTER_SELECT_CLASS}>
                                        <option value="">All statuses</option>
                                        {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </label>
                                <label className="text-sm font-medium text-slate-700">
                                    Category
                                    <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className={FILTER_SELECT_CLASS}>
                                        <option value="">All categories</option>
                                        {distinctValues(assets, 'category').map(category => <option key={category} value={category}>{category}</option>)}
                                    </select>
                                </label>
                                <label className="text-sm font-medium text-slate-700">
                                    Location
                                    <select value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} className={FILTER_SELECT_CLASS}>
                                        <option value="">All locations</option>
                                        {distinctValues(assets, 'location').map(location => <option key={location} value={location}>{location}</option>)}
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchParams({}, { replace: true });
                                        setCurrentPage(1);
                                    }}
                                    disabled={activeFilterCount === 0}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                >
                                    <X className="h-4 w-4" />
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200/50">
                                <thead className="bg-slate-50/50 backdrop-blur-md">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Asset Details
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category/Brand
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Location/Assignee
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="relative px-6 py-4 text-right">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/50">
                                    {paginatedAssets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-white/60 transition-all duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{asset.assetName}</span>
                                                    <span className="text-xs text-gray-500">Ref: {asset.refNumber} | SN: {asset.serialNumber || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900">{asset.category}</span>
                                                    <span className="text-xs text-gray-500">{[asset.brand, asset.model].filter(Boolean).join(' - ') || 'No Brand'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900">{asset.location || 'Unknown'}</span>
                                                    <span className="text-xs text-gray-500">{asset.assignedTo || 'Unassigned'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(asset.status)}`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-900" title="View Details" aria-label={`View ${asset.assetName}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    {!isAuditor && (
                                                        <>
                                                            <Link to={`/assets/edit/${asset.id}`} className="text-emerald-600 hover:text-emerald-900" title="Edit Asset" aria-label={`Edit ${asset.assetName}`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(asset)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete Asset"
                                                                aria-label={`Delete ${asset.assetName}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredAssets.length === 0 && (
                                <div className="text-center py-12 flex flex-col items-center">
                                    <MonitorSmartphone className="mx-auto h-12 w-12 text-gray-300" />
                                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No assets found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {term || activeFilterCount > 0 ? 'Try adjusting your search filters.' : 'Get started by importing your master sheet.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer */}
                        {filteredAssets.length > 0 && (
                            <div className="bg-slate-50/50 backdrop-blur-md px-6 py-4 border-t border-slate-200/50 flex items-center justify-between">
                                {/* Mobile */}
                                <div className="flex flex-1 items-center justify-between sm:hidden">
                                    <button
                                        onClick={() => goToPage(page - 1)}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                                    <button
                                        onClick={() => goToPage(page + 1)}
                                        disabled={page === totalPages}
                                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>

                                {/* Desktop */}
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">
                                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredAssets.length)}</span> of{' '}
                                            <span className="font-medium">{filteredAssets.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => goToPage(page - 1)}
                                                disabled={page === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                            </button>

                                            {/* Simple page indicator instead of full array to save space */}
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                Page {page} of {totalPages}
                                            </span>

                                            <button
                                                onClick={() => goToPage(page + 1)}
                                                disabled={page === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Next</span>
                                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
