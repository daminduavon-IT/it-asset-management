import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Eye, Trash2, MonitorSmartphone, UploadCloud, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Asset } from '../../types';
import { getAssets, deleteAsset, bulkImportAssets } from '../../config/assetService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import importedAssets from '../../data/imported-assets.json';

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [importing, setImporting] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await getAssets();
            setAssets(data);
        } catch (error) {
            console.error('Error fetching assets:', error);
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
                // Using Firebase writes batches to process all 100+ documents immediately
                await bulkImportAssets(importedAssets);
                toast.success(`Successfully imported all assets!`);
                fetchAssets();
            } catch (err) {
                console.error('Import failed', err);
                toast.error('Import failed midway.');
            } finally {
                setImporting(false);
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                await deleteAsset(id);
                toast.success('Asset deleted successfully');
                fetchAssets();
            } catch (error) {
                console.error('Error deleting asset:', error);
                toast.error('Failed to delete asset');
            }
        }
    };

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchTerm]);

    const handleExportCode = () => {
        try {
            const csvRows = [];
            const headers = ['Name', 'Ref Number', 'Serial Number', 'Category', 'Brand', 'Model', 'Status', 'Location', 'Assigned To'];
            csvRows.push(headers.join(','));

            for (const asset of filteredAssets) {
                const values = [
                    `"${asset.assetName || ''}"`,
                    `"${asset.refNumber || ''}"`,
                    `"${asset.serialNumber || ''}"`,
                    `"${asset.category || ''}"`,
                    `"${asset.brand || ''}"`,
                    `"${asset.model || ''}"`,
                    `"${asset.status || ''}"`,
                    `"${asset.location || ''}"`,
                    `"${asset.assignedTo || ''}"`
                ];
                csvRows.push(values.join(','));
            }

            const csvData = csvRows.join('\n');
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'it_assets_export.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
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

    const filteredAssets = assets.filter(asset => {
        const searchLower = searchTerm.toLowerCase();
        return (
            asset.assetName?.toLowerCase().includes(searchLower) ||
            asset.refNumber?.toLowerCase().includes(searchLower) ||
            asset.serialNumber?.toLowerCase().includes(searchLower) ||
            asset.assignedTo?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

    // Use inline loading within the table body layout instead

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">IT Assets Inventory</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        A comprehensive list of all company IT equipment.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 flex flex-wrap items-center gap-3 justify-end">
                    {assets.length === 0 && ( /* Only show import if DB is empty to avoid accidental imports */
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
                    <Link
                        to="/assets/add"
                        className="inline-flex items-center gap-2 justify-center rounded-lg bg-[#005500] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-800 transition-all hover:shadow-lg active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Asset
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="relative flex-1 max-w-md">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                placeholder="Search by name, ref no, or serial..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="inline-flex items-center gap-2 justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <Filter className="h-4 w-4 text-gray-500" />
                            More Filters
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                        <th scope="col" className="relative px-6 py-3 text-right">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedAssets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-emerald-50/50 transition-all duration-200 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{asset.assetName}</span>
                                                    <span className="text-xs text-gray-500">Ref: {asset.refNumber} | SN: {asset.serialNumber || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900">{asset.category}</span>
                                                    <span className="text-xs text-gray-500">{asset.brand || 'No Brand'} - {asset.model || ''}</span>
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
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-900" title="View Details">
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link to={`/assets/edit/${asset.id}`} className="text-primary-600 hover:text-primary-900" title="Edit Asset">
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(asset.id!, asset.assetName)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete Asset"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
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
                                        {searchTerm ? 'Try adjusting your search filters.' : 'Get started by importing your master sheet.'}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Pagination Footer */}
                        {filteredAssets.length > 0 && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredAssets.length)}</span> of{' '}
                                            <span className="font-medium">{filteredAssets.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                            
                                            {/* Simple page indicator instead of full array to save space */}
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                Page {currentPage} of {totalPages}
                                            </span>

                                            <button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
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
