import { useForm } from 'react-hook-form';
import { X, Save, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { addServiceLog } from '../../services/serviceLogService';
import type { ServiceLog } from '../../types';

interface Props {
    asset: { id: string; assetName: string; category: string };
    onClose: () => void;
    onSuccess: () => void;
}

type ServiceFormData = Omit<ServiceLog, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'createdByName' | 'assetId' | 'assetName' | 'assetCategory'>;

const INPUT_CLASS = 'mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6';
const LABEL_CLASS = 'block text-sm font-medium leading-6 text-gray-900';

export default function AddServiceRecordModal({ asset, onClose, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ServiceFormData>();

    const onSubmit = async (data: ServiceFormData) => {
        try {
            await addServiceLog({
                assetId: asset.id,
                assetName: asset.assetName,
                assetCategory: asset.category,
                serviceDate: data.serviceDate,
                serviceType: data.serviceType,
                serviceDetails: data.serviceDetails,
                partsReplaced: data.partsReplaced,
                technicianName: data.technicianName,
                serviceProvider: data.serviceProvider,
                serviceCost: data.serviceCost ? Number(data.serviceCost) : undefined,
                nextServiceDate: data.nextServiceDate,
                remarks: data.remarks
            });
            toast.success('Service record added successfully!');
            onSuccess();
        } catch (error) {
            toast.error('Failed to add service record.');
            console.error(error);
        }
    };

    return (
        /* Modal backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl text-[#005500]">
                            <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Add Service Record</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{asset.assetName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Row 1: Service Date + Type */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label className={LABEL_CLASS}>Service Date *</label>
                            <input
                                type="date"
                                {...register('serviceDate', { required: 'Service date is required' })}
                                className={INPUT_CLASS}
                            />
                            {errors.serviceDate && <span className="text-red-500 text-xs mt-1">{errors.serviceDate.message}</span>}
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Service Type *</label>
                            <select
                                {...register('serviceType', { required: 'Service type is required' })}
                                className={INPUT_CLASS}
                            >
                                <option value="">Select type</option>
                                <option value="Full Service">Full Service</option>
                                <option value="Repair">Repair</option>
                                <option value="OS Reinstall">OS Reinstall</option>
                                <option value="Hardware Upgrade">Hardware Upgrade</option>
                                <option value="Preventive Maintenance">Preventive Maintenance</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.serviceType && <span className="text-red-500 text-xs mt-1">{errors.serviceType.message}</span>}
                        </div>
                    </div>

                    {/* Row 2: Service Details */}
                    <div>
                        <label className={LABEL_CLASS}>Service Details</label>
                        <textarea
                            {...register('serviceDetails')}
                            rows={3}
                            placeholder="Describe what was done during this service..."
                            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 resize-none"
                        />
                    </div>

                    {/* Row 3: Parts Replaced + Technician */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label className={LABEL_CLASS}>Parts Replaced</label>
                            <input
                                type="text"
                                {...register('partsReplaced')}
                                placeholder="e.g. Battery, Cooling Fan"
                                className={INPUT_CLASS}
                            />
                            <p className="mt-1 text-xs text-gray-400">Separate multiple parts with commas</p>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Technician Name</label>
                            <input
                                type="text"
                                {...register('technicianName')}
                                placeholder="e.g. Nimal"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    {/* Row 4: Service Provider + Cost */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label className={LABEL_CLASS}>Service Provider</label>
                            <input
                                type="text"
                                {...register('serviceProvider')}
                                placeholder="e.g. Internal IT"
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Service Cost (LKR)</label>
                            <input
                                type="number"
                                {...register('serviceCost', { valueAsNumber: true, min: 0 })}
                                placeholder="e.g. 15000"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    {/* Row 5: Next Service Date + Remarks */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label className={LABEL_CLASS}>Next Service Date</label>
                            <input
                                type="date"
                                {...register('nextServiceDate')}
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>Remarks</label>
                            <input
                                type="text"
                                {...register('remarks')}
                                placeholder="e.g. Working properly"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-x-4 border-t pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-[#005500] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
