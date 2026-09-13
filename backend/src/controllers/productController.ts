import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { emitProductsChanged } from '../realtime';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, sort, isActive } = req.query;

    const query: Record<string, any> = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        query.category = category;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    let sortOption: Record<string, any> = { createdAt: -1 };
    if (sort === 'price-low') {
      sortOption = { price: 1 };
    } else if (sort === 'price-high') {
      sortOption = { price: -1 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlugOrId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier } = req.params;
    let product;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier).populate('category', 'name slug');
    }

    if (!product) {
      product = await Product.findOne({ slug: identifier }).populate('category', 'name slug');
    }

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug, description, price, unit, stockQuantity, imageUrl, categoryId, badge, isActive } = req.body;

    const computedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = await Product.create({
      name,
      slug: computedSlug,
      description,
      price: Number(price),
      unit: unit || 'kg',
      stockQuantity: Number(stockQuantity) || 0,
      imageUrl: imageUrl || '/images/red-chili-powder.jpg',
      category: categoryId,
      badge,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await product.populate('category', 'name slug');

    emitProductsChanged();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.categoryId) {
      updateData.category = updateData.categoryId;
      delete updateData.categoryId;
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

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
