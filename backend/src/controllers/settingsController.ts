import { Request, Response, NextFunction } from 'express';
import { getStoreSettings } from '../models/Settings';
import { pick } from '../utils/helpers';
import { emitSettingsChanged } from '../realtime';

const EDITABLE = [
  'storeName', 'phones', 'whatsapp', 'email', 'address', 'hours', 'upiId', 'upiName',
  'taxRate', 'gstin', 'fssaiLicense', 'lowStockThreshold', 'acceptingOrders', 'closedMessage', 'announcement', 'millRates',
] as const;

/* ── Public: store details used by the storefront (checkout UPI, rates ticker, banner) ── */
export const getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getStoreSettings();
    res.set('Cache-Control', 'public, max-age=60');
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/* ── Admin: update store settings ── */
export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = pick(req.body, EDITABLE) as Record<string, unknown>;

    if (data.phones !== undefined) {
      data.phones = (Array.isArray(data.phones) ? data.phones : [])
        .map((p) => String(p).trim())
        .filter(Boolean)
        .slice(0, 4);
    }
    if (data.millRates !== undefined) {
      data.millRates = (Array.isArray(data.millRates) ? data.millRates : [])
        .map((r: { label?: unknown; price?: unknown }) => ({ label: String(r?.label ?? '').trim(), price: String(r?.price ?? '').trim() }))
        .filter((r) => r.label && r.price)
        .slice(0, 12);
    }
    if (data.taxRate !== undefined) data.taxRate = Number(data.taxRate);
    if (data.lowStockThreshold !== undefined) data.lowStockThreshold = Math.max(0, Number(data.lowStockThreshold) || 0);
    if (data.acceptingOrders !== undefined) data.acceptingOrders = Boolean(data.acceptingOrders);

    const settings = await getStoreSettings();
    settings.set(data);
    await settings.save();

    emitSettingsChanged();
    res.status(200).json({ success: true, message: 'Store settings saved', data: settings });
  } catch (error) {
    next(error);
  }
};
