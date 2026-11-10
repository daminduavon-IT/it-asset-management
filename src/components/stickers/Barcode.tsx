import { encodeCode128 } from '../../utils/code128';

interface BarcodeProps {
    value: string;
    /** Widest the barcode may get, in inches */
    maxWidthIn: number;
    heightIn: number;
}

const QUIET_ZONE = 10; // blank modules on each side, required by scanners
const MODULE_IN = 0.015; // preferred width of the narrowest bar; long values shrink to fit maxWidthIn

/** Code 128 barcode drawn as an SVG, so it stays sharp at any printer resolution. */
export default function Barcode({ value, maxWidthIn, heightIn }: BarcodeProps) {
    const widths = encodeCode128(value);
    if (!widths) return null;

    let x = QUIET_ZONE;
    let bars = '';
    widths.forEach((width, index) => {
        if (index % 2 === 0) bars += `M${x} 0h${width}v1h-${width}z`;
        x += width;
    });
    const totalModules = x + QUIET_ZONE;

    return (
        <svg
            className="sticker-barcode"
            width={`${Math.min(maxWidthIn, totalModules * MODULE_IN).toFixed(3)}in`}
            height={`${heightIn}in`}
            viewBox={`0 0 ${totalModules} 1`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Barcode ${value}`}
        >
            <path d={bars} fill="#000" />
        </svg>
    );
}
