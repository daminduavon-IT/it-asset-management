import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Asset } from '../../types';
import { getAssetById, updateAsset } from '../../config/assetService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function EditAssetPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Asset>();

    useEffect(() => {
        const fetchAsset = async () => {
            if (!id) return;
            try {
                const data = await getAssetById(id);
                if (data) {
                    // Format the dates so they fit nicely into the <input type="date">
                    const formattedData = {
                        ...data,
                        purchaseDate: data.purchaseDate ? data.purchaseDate.toString().split('T')[0] : '',
                        warrantyEnd: data.warrantyEnd ? data.warrantyEnd.toString().split('T')[0] : '',
                        nextServiceDate: data.nextServiceDate ? data.nextServiceDate.toString().split('T')[0] : '',
                    };
                    reset(formattedData);
                } else {
                    toast.error('Asset not found');
                    navigate('/assets');
                }
            } catch (error) {
                toast.error('Failed to load asset data');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [id, reset, navigate]);

    const onSubmit = async (data: Asset) => {
        if (!id) return;
        try {
            await updateAsset(id, data);
            toast.success('Asset updated successfully!');
            navigate('/assets');
        } catch (error) {
            toast.error('Failed to update asset. Check permissions.');
            console.error(error);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit IT Asset</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Modify the details for this inventory item.
                </p>
            </div>

            <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">

                    {/* Section 1: Basic Details */}
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900 border-b pb-2 mb-4">Device Information</h3>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Asset Name *</label>
                                <input
                                    type="text"
                                    {...register('assetName', { required: 'Asset name is required' })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                                {errors.assetName && <span className="text-red-500 text-xs mt-1">{errors.assetName.message}</span>}
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Category *</label>
                                <select
                                    {...register('category', { required: 'Category is required' })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select category</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Desktop">Desktop</option>
                                    <option value="Monitor">Monitor</option>
                                    <option value="Printer">Printer</option>
                                    <option value="Networking">Networking</option>
                                    <option value="Accessories">Accessories</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.category && <span className="text-red-500 text-xs mt-1">{errors.category.message}</span>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Brand</label>
                                <input
                                    type="text"
                                    {...register('brand')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Model</label>
                                <input
                                    type="text"
                                    {...register('model')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Serial Number</label>
                                <input
                                    type="text"
                                    {...register('serialNumber')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Tracking & Financial */}
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900 border-b pb-2 mb-4">Financial & Tracking</h3>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Internal Ref Number *</label>
                                <input
                                    type="text"
                                    {...register('refNumber', { required: 'Reference number is required' })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                                {errors.refNumber && <span className="text-red-500 text-xs mt-1">{errors.refNumber.message}</span>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Unit Price (LKR)</label>
                                <input
                                    type="number"
                                    {...register('unitPrice', { valueAsNumber: true })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Purchase Date</label>
                                <input
                                    type="date"
                                    {...register('purchaseDate')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Next Service Date</label>
                                <input
                                    type="date"
                                    {...register('nextServiceDate')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Status & Assignment */}
                    <div>
                        <h3 className="text-base font-semibold leading-7 text-gray-900 border-b pb-2 mb-4">Allocation</h3>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Location</label>
                                <select
                                    {...register('location')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="Head Office">Head Office</option>
                                    <option value="BioSafe">BioSafe</option>
                                    <option value="Greenlab">Greenlab</option>
                                    <option value="Stores1">Stores1</option>
                                    <option value="Stores2">Stores2</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Department *</label>
                                <select
                                    {...register('department', { required: 'Department is required' })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="">Select department</option>
                                    <option value="HR">HR</option>
                                    <option value="FINANCE">FINANCE</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="IT">IT</option>
                                    <option value="MARKETING">MARKETING</option>
                                    <option value="COORDINATION & CUSTOMER CARE">COORDINATION & CUSTOMER CARE</option>
                                </select>
                                {errors.department && <span className="text-red-500 text-xs mt-1">{errors.department.message}</span>}
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Assigned To (Employee Name)</label>
                                <input
                                    type="text"
                                    {...register('assignedTo')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Status *</label>
                                <select
                                    {...register('status', { required: true })}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Assigned">Assigned</option>
                                    <option value="Under Repair">Under Repair</option>
                                    <option value="Retired">Retired</option>
                                </select>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium leading-6 text-gray-900">Remarks</label>
                                <input
                                    type="text"
                                    {...register('remarks')}
                                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-x-4 border-t pt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/assets')}
                            className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? 'Updating...' : 'Update Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
