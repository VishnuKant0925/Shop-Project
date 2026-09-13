import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Service } from '../models/Service';

export const getServices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { isActive } = req.query;
    const query: Record<string, any> = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
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
    const computedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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
    const service = await Service.findByIdAndUpdate(id, req.body, {
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
