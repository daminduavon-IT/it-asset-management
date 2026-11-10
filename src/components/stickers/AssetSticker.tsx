import type { Asset } from '../../types';
import Barcode from './Barcode';
import { joinParts, stickerCode, assetSpecs } from './stickerData';
import type { StickerVariant } from './stickerData';

const SUPPORT_LINE = 'IT Support: it@avonpc.com  |  +94 70 660 9795';

interface AssetStickerProps {
    asset: Asset;
    variant: StickerVariant;
    /** Print the assigned user and department (off by default, since devices change hands) */
    showAssignee?: boolean;
}

/** One printable asset label. Sizes and fonts live in the .sticker rules of index.css. */
export default function AssetSticker({ asset, variant, showAssignee = false }: AssetStickerProps) {
    const code = stickerCode(asset);
    const ref = asset.refNumber?.trim();

    const footer = (
        <div className="sticker-foot">
            <div className="sticker-support">{SUPPORT_LINE}</div>
            <div className="sticker-warning">DO NOT REMOVE OR TAMPER</div>
        </div>
    );

    if (variant === 'charger') {
        return (
            <div className="sticker sticker-charger">
                <div className="sticker-head">
                    <img src="/avon-logo-sm.png" alt="" className="sticker-logo" />
                    <div className="sticker-head-text">
                        <div className="sticker-owner">PROPERTY OF AVON PHARMO CHEM</div>
                        <div><span className="sticker-chip">LAPTOP CHARGER</span></div>
                    </div>
                </div>
                {code.value && (
                    <div className="sticker-code">
                        <span className="sticker-code-label">Laptop {code.isSerial ? 'S/N' : 'Ref'}: </span>
                        <span className="sticker-code-value">{code.value}</span>
                    </div>
                )}
                <div className="sticker-line">{joinParts([asset.assetName, code.isSerial ? ref : ''], '  ·  ')}</div>
                {code.value && <Barcode value={code.value} maxWidthIn={2.1} heightIn={0.25} />}
                {footer}
            </div>
        );
    }

    const specs = assetSpecs(asset);
    const assignee = showAssignee ? joinParts([asset.assignedTo, asset.department], ' · ') : '';

    return (
        <div className="sticker sticker-device">
            <div className="sticker-head">
                <img src="/avon-logo-sm.png" alt="" className="sticker-logo" />
                <div className="sticker-head-text">
                    <div className="sticker-owner">PROPERTY OF AVON PHARMO CHEM</div>
                    <div className="sticker-name">{asset.assetName}</div>
                    <div className="sticker-line">{joinParts([asset.category, joinParts([asset.brand, asset.model], ' ')], ' · ')}</div>
                </div>
            </div>
            {code.value && (
                <div className="sticker-code">
                    <span className="sticker-code-label">{code.label}: </span>
                    <span className="sticker-code-value">{code.value}</span>
                </div>
            )}
            {((code.isSerial && ref) || specs || assignee) && (
                <div className="sticker-details">
                    {code.isSerial && ref && <div className="sticker-line"><b>Asset Ref:</b> {ref}</div>}
                    {specs && <div className="sticker-line">{specs}</div>}
                    {assignee && <div className="sticker-line"><b>User:</b> {assignee}</div>}
                </div>
            )}
            {code.value && <Barcode value={code.value} maxWidthIn={3.1} heightIn={0.36} />}
            {footer}
        </div>
    );
}
