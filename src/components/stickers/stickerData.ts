import type { Asset } from '../../types';

export type StickerVariant = 'device' | 'charger';

/** Label sizes and how many fit on one A4 sheet with 0.5in margins. Keep in sync with the .sticker rules in index.css. */
export const STICKER_LAYOUTS: Record<StickerVariant, { name: string; size: string; columns: number; perPage: number }> = {
    device: { name: 'Device stickers', size: '3.5" × 2.2"', columns: 2, perPage: 8 },
    charger: { name: 'Laptop charger stickers', size: '2.33" × 1.5"', columns: 3, perPage: 18 },
};

export const joinParts = (parts: (string | null | undefined)[], separator: string) =>
    parts.map(part => part?.trim()).filter(Boolean).join(separator);

/** The identifier printed large and encoded in the barcode: the serial number, or the asset ref when there is none. */
export const stickerCode = (asset: Asset) => {
    const serial = asset.serialNumber?.trim();
    if (serial) return { label: 'S/N', value: serial, isSerial: true };
    return { label: 'Asset Ref', value: asset.refNumber?.trim() ?? '', isSerial: false };
};

export const assetSpecs = (asset: Asset) =>
    joinParts([asset.processorType, asset.ram, asset.storage, asset.os], ' · ');
