import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { emitProductsChanged } from '../realtime';
import { pick, slugify } from '../utils/helpers';

const EDITABLE = ['name', 'slug', 'description', 'imageUrl'] as const;

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }
    const computedSlug = slugify(slug || name);

    const category = await Category.create({
      name,
      slug: computedSlug,
      description,
      imageUrl,
    });

    emitProductsChanged();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const update = pick(req.body, EDITABLE) as Record<string, unknown>;
    if (typeof update.slug === 'string') update.slug = slugify(update.slug);
    const category = await Category.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    emitProductsChanged();
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const inUse = await Product.countDocuments({ category: id });
    if (inUse > 0) {
      res.status(400).json({
        success: false,
        message: `This category still has ${inUse} product(s). Move or delete them first.`,
      });
      return;
    }
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    emitProductsChanged();
    res.status(200).json({ success: true, message: 'Category removed successfully' });
  } catch (error) {
    next(error);
  }
};
