import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Service } from '../models/Service';
import { AuthRequest } from '../middleware/auth';
import { pick, slugify } from '../utils/helpers';

const EDITABLE = ['name', 'slug', 'description', 'rate', 'rateUnit', 'imageUrl', 'icon', 'features', 'isActive'] as const;

export const getServices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Public visitors only see active services; admins can request everything with ?all=true.
    const query: Record<string, unknown> = {};
    if (!(req.query.all === 'true' && req.user?.role === 'admin')) {
      query.isActive = true;
    }

    const services = await Service.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

export const getServiceBySlugOrId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;
    let service;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      service = await Service.findById(identifier);
    }

    if (!service) {
      service = await Service.findOne({ slug: identifier });
    }

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug, description, rate, rateUnit, imageUrl, icon, features, isActive } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Service name is required' });
      return;
    }
    const computedSlug = slugify(slug || name);

    const service = await Service.create({
      name,
      slug: computedSlug,
      description,
      rate: Number(rate),
      rateUnit,
      imageUrl: imageUrl || '/images/flour-milling.jpg',
      icon: icon || '⚙️',
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const update = pick(req.body, EDITABLE) as Record<string, unknown>;
    if (typeof update.slug === 'string') update.slug = slugify(update.slug);
    if (update.rate !== undefined) update.rate = Number(update.rate);
    const service = await Service.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};
