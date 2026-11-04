import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { emitProductsChanged } from '../realtime';
import { pick, searchRegex, slugify } from '../utils/helpers';

const EDITABLE = ['name', 'slug', 'description', 'price', 'unit', 'stockQuantity', 'imageUrl', 'badge', 'isActive'] as const;

const toUpdate = (body: Record<string, unknown>) => {
  const data = pick(body, EDITABLE) as Record<string, unknown>;
  if (body.categoryId !== undefined) data.category = body.categoryId;
  if (data.price !== undefined) data.price = Number(data.price);
  if (data.stockQuantity !== undefined) data.stockQuantity = Math.max(0, Math.floor(Number(data.stockQuantity) || 0));
  if (typeof data.slug === 'string') data.slug = slugify(data.slug);
  return data;
};

/**
 * Public catalogue: only active products.
 * Admins can pass `?all=true` to include hidden products for the management screens.
 */
export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, sort, all } = req.query;
    const query: Record<string, unknown> = {};

    if (!(all === 'true' && req.user?.role === 'admin')) {
      query.isActive = true;
    }

    if (typeof category === 'string' && category !== 'all' && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    const rx = searchRegex(search);
    if (rx) query.$or = [{ name: rx }, { description: rx }];

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption);

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlugOrId = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;
    let product = mongoose.Types.ObjectId.isValid(identifier)
      ? await Product.findById(identifier).populate('category', 'name slug')
      : null;

    if (!product) {
      product = await Product.findOne({ slug: identifier.toLowerCase() }).populate('category', 'name slug');
    }

    // Hidden products behave as "not found" for shoppers and search engines.
    if (!product || (!product.isActive && req.user?.role !== 'admin')) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = toUpdate(req.body);
    if (typeof data.name !== 'string' || !data.name.trim()) {
      res.status(400).json({ success: false, message: 'Product name is required' });
      return;
    }

    const product = await Product.create({
      unit: 'kg',
      stockQuantity: 0,
      imageUrl: '/images/red-chili-powder.jpg',
      isActive: true,
      ...data,
      slug: data.slug || slugify(data.name),
    });

    const populated = await product.populate('category', 'name slug');
    emitProductsChanged();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, toUpdate(req.body), {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    emitProductsChanged();
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    emitProductsChanged();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
