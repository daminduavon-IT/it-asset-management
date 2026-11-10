import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { Printer, Search, AlertTriangle, RotateCw, Info, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Asset } from '../../types';
import { getAssets } from '../../config/assetService';
import { isComputerCategory } from '../../constants/assets';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AssetSticker from '../../components/stickers/AssetSticker';
import { STICKER_LAYOUTS, assetSpecs, joinParts, stickerCode } from '../../components/stickers/stickerData';
import type { StickerVariant } from '../../components/stickers/stickerData';
import { usePageTitle } from '../../hooks/usePageTitle';

type Scope = 'computers' | 'laptops' | 'desktops' | 'all';

const isLaptop = (asset: Asset) => /\blaptop\b/i.test(asset.category ?? '');

const SCOPES: Record<Scope, { label: string; match: (asset: Asset) => boolean }> = {
    computers: { label: 'Laptops & Desktops', match: asset => isComputerCategory(asset.category) },
    laptops: { label: 'Laptops', match: isLaptop },
    desktops: { label: 'Desktops', match: asset => isComputerCategory(asset.category) && !isLaptop(asset) },
    all: { label: 'All assets', match: () => true },
};

const VARIANTS: StickerVariant[] = ['device', 'charger'];

const FIELD_CLASS = 'mt-1 block w-full rounded-xl border-0 py-2 text-slate-900 bg-white/70 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm disabled:opacity-60';

// Sheets come out in asset-ref order (AV/LP/001, AV/LP/002, …) so they are easy to hand out
const byRefNumber = (a: Asset, b: Asset) =>
    (a.refNumber ?? '').localeCompare(b.refNumber ?? '', undefined, { numeric: true, sensitivity: 'base' })
    || (a.assetName ?? '').localeCompare(b.assetName ?? '');

const chunk = <T,>(items: T[], size: number) => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
};

export default function StickersPage() {
    usePageTitle('Asset Stickers');
    const [searchParams] = useSearchParams();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [variant, setVariant] = useState<StickerVariant>('device');
    const [scope, setScope] = useState<Scope>('computers');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignee, setShowAssignee] = useState(false);
    const [includeLog, setIncludeLog] = useState(false);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            setLoadError(false);
            const data = (await getAssets()).sort(byRefNumber);
            setAssets(data);

            // "Print Sticker" on an asset's page links here with ?ids=<id>; otherwise start with every laptop and desktop ticked
            const requestedIds = (searchParams.get('ids') ?? '').split(',').filter(Boolean);
            const requested = data.filter(asset => requestedIds.includes(asset.id));
            if (requested.length > 0) {
                setScope(requested.every(SCOPES.computers.match) ? 'computers' : 'all');
                setSelected(new Set(requested.map(asset => asset.id)));
            } else {
                setSelected(new Set(data.filter(SCOPES.computers.match).map(asset => asset.id)));
            }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; ?ids= is only read on arrival
    }, []);

    // Charger stickers only make sense for laptops
    const activeScope: Scope = variant === 'charger' ? 'laptops' : scope;
    const layout = STICKER_LAYOUTS[variant];
    const scopeAssets = assets.filter(SCOPES[activeScope].match);

    const term = searchTerm.trim().toLowerCase();
    const visibleAssets = term
        ? scopeAssets.filter(asset =>
            [asset.assetName, asset.refNumber, asset.serialNumber, asset.assignedTo, asset.category, asset.brand, asset.model, asset.location]
                .some(value => value?.toLowerCase().includes(term)))
        : scopeAssets;

    // Ticks are kept when the list is narrowed; only ticked assets inside the current group are printed
    const printAssets = scopeAssets.filter(asset => selected.has(asset.id));
    const pages = chunk(printAssets, layout.perPage);
    const withoutSerial = printAssets.filter(asset => !stickerCode(asset).isSerial).length;
    const allVisibleSelected = visibleAssets.length > 0 && visibleAssets.every(asset => selected.has(asset.id));

    const toggleAsset = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllVisible = () => {
        setSelected(prev => {
            const next = new Set(prev);
            for (const asset of visibleAssets) {
                if (allVisibleSelected) next.delete(asset.id);
                else next.add(asset.id);
            }
            return next;
        });
    };

    const sheetTitle = `AVON PHARMO CHEM (PVT) LTD — IT ASSET STICKERS${variant === 'charger' ? ' (LAPTOP CHARGERS)' : ''}`;
    const sheetMeta = `Batch: ${printAssets.length} × ${SCOPES[activeScope].label}  |  Label: ${layout.size} (${layout.columns} columns / A4)  |  Barcode: Code 128`;

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Asset Stickers</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Stickers are generated from the inventory, with the device details and a Code 128 barcode, ready to print on A4.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={printAssets.length === 0}
                        className="inline-flex items-center gap-2 justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        <Printer className="h-5 w-5" />
                        Print {printAssets.length} {printAssets.length === 1 ? 'sticker' : 'stickers'}
                    </button>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <span className="text-sm font-medium text-slate-700">Sticker type</span>
                                <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-slate-200/60 p-1" role="group" aria-label="Sticker type">
                                    {VARIANTS.map(option => (
                                        <button
                                            key={option}
                                            type="button"
                                            aria-pressed={variant === option}
                                            onClick={() => setVariant(option)}
                                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${variant === option
                                                ? 'bg-white text-emerald-700 shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {option === 'device' ? 'Device' : 'Laptop charger'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label className="text-sm font-medium text-slate-700">
                                Assets
                                <select
                                    value={activeScope}
                                    onChange={(e) => setScope(e.target.value as Scope)}
                                    disabled={variant === 'charger'}
                                    className={FIELD_CLASS}
                                >
                                    {(Object.keys(SCOPES) as Scope[]).map(key => (
                                        <option key={key} value={key}>{SCOPES[key].label}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="relative group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    aria-label="Search assets"
                                    className="block w-full rounded-xl border-0 py-2 pl-10 pr-3 text-slate-900 bg-white/70 shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm transition-all"
                                    placeholder="Search by name, ref no, serial or assignee..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200/60 pt-4 text-sm text-slate-700">
                            <label className={`inline-flex items-center gap-2 ${variant === 'charger' ? 'opacity-50' : ''}`}>
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                                    checked={showAssignee && variant === 'device'}
                                    disabled={variant === 'charger'}
                                    onChange={(e) => setShowAssignee(e.target.checked)}
                                />
                                Show assigned user &amp; department
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                                    checked={includeLog}
                                    onChange={(e) => setIncludeLog(e.target.checked)}
                                />
                                Add inventory log page
                            </label>
                            <span className="sm:ml-auto text-slate-500">
                                {layout.size} labels · {layout.perPage} per A4 sheet · {pages.length} {pages.length === 1 ? 'sheet' : 'sheets'}
                            </span>
                        </div>

                        {withoutSerial > 0 && (
                            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                <span>
                                    {withoutSerial} of the selected assets {withoutSerial === 1 ? 'has' : 'have'} no serial number saved.
                                    {' '}{withoutSerial === 1 ? 'Its sticker shows' : 'Their stickers show'} the Asset Ref No and its barcode instead.
                                </span>
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_25rem] gap-6 items-start animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="glass-card rounded-3xl overflow-hidden">
                            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-200/50 text-sm">
                                <span className="font-semibold text-slate-900">
                                    {printAssets.length} of {scopeAssets.length} selected
                                </span>
                                {term && (
                                    <span className="text-slate-500">{visibleAssets.length} matching “{searchTerm.trim()}”</span>
                                )}
                            </div>
                            <div className="max-h-[36rem] overflow-auto">
                                <table className="min-w-full divide-y divide-slate-200/50">
                                    <thead className="bg-slate-50 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" className="pl-6 pr-2 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                                                    aria-label="Select all listed assets"
                                                    checked={allVisibleSelected}
                                                    disabled={visibleAssets.length === 0}
                                                    onChange={toggleAllVisible}
                                                />
                                            </th>
                                            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</th>
                                            <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ref No / Serial</th>
                                            <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned to</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200/50">
                                        {visibleAssets.map(asset => (
                                            <tr
                                                key={asset.id}
                                                onClick={() => toggleAsset(asset.id)}
                                                className={`cursor-pointer transition-colors ${selected.has(asset.id) ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-white/60'}`}
                                            >
                                                <td className="pl-6 pr-2 py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                                                        aria-label={`Select ${asset.assetName}`}
                                                        checked={selected.has(asset.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={() => toggleAsset(asset.id)}
                                                    />
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-sm font-medium text-gray-900">{asset.assetName}</div>
                                                    <div className="text-xs text-gray-500">{joinParts([asset.category, asset.brand, asset.model], ' · ')}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-sm text-gray-900">{asset.refNumber || '—'}</div>
                                                    <div className={`text-xs ${asset.serialNumber?.trim() ? 'text-gray-500' : 'text-amber-600'}`}>
                                                        {asset.serialNumber?.trim() ? `SN: ${asset.serialNumber}` : 'No serial number'}
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-700">
                                                    {asset.assignedTo || 'Unassigned'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {visibleAssets.length === 0 && (
                                    <div className="text-center py-12 flex flex-col items-center">
                                        <Tags className="mx-auto h-12 w-12 text-gray-300" />
                                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No assets found</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {term ? 'Try a different search.' : `There are no ${SCOPES[activeScope].label.toLowerCase()} in the inventory yet.`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card rounded-3xl overflow-hidden">
                            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-200/50 text-sm">
                                <span className="font-semibold text-slate-900">Preview</span>
                                <span className="text-slate-500">Actual size</span>
                            </div>
                            <div className="max-h-[36rem] overflow-auto p-4">
                                {printAssets.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-slate-500">Tick the assets that need a sticker.</p>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 w-max mx-auto">
                                        {printAssets.map(asset => (
                                            <AssetSticker key={asset.id} asset={asset} variant={variant} showAssignee={showAssignee} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* The sheet that goes to the printer. It sits outside #root because the app layout clips and scrolls its content. */}
            {createPortal(
                <div className="print-sheet">
                    <style>{'@page { size: A4; margin: 0.5in; }'}</style>
                    {pages.map((pageAssets, index) => (
                        <section className="print-page" key={index}>
                            <div className="print-page-title">{sheetTitle}</div>
                            <div className="print-page-meta">{sheetMeta}  |  Page {index + 1} of {pages.length}</div>
                            <div className={`sticker-grid sticker-grid-${variant}`}>
                                {pageAssets.map(asset => (
                                    <AssetSticker key={asset.id} asset={asset} variant={variant} showAssignee={showAssignee} />
                                ))}
                            </div>
                        </section>
                    ))}
                    {includeLog && printAssets.length > 0 && (
                        <section className="print-page">
                            <div className="print-page-title">ASSET &amp; SERIAL NUMBER INVENTORY LOG</div>
                            <div className="print-page-meta">{sheetMeta}</div>
                            <table className="print-log">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Service Tag / S/N</th>
                                        <th>Asset Ref No</th>
                                        <th>Device</th>
                                        <th>Hardware Specification</th>
                                        <th>Assigned User / Dept</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {printAssets.map((asset, index) => (
                                        <tr key={asset.id}>
                                            <td>{index + 1}</td>
                                            <td>{asset.serialNumber?.trim() || '—'}</td>
                                            <td>{asset.refNumber || '—'}</td>
                                            <td>{joinParts([asset.assetName, joinParts([asset.brand, asset.model], ' ')], ' — ')}</td>
                                            <td>{assetSpecs(asset) || '—'}</td>
                                            <td>{joinParts([asset.assignedTo, asset.department], ' / ') || '—'}</td>
                                            <td>{asset.location || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}
