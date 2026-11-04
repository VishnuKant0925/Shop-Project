'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import { api } from '@/lib/api';
import { Product } from '@/types';
import styles from './page.module.css';
import ui from '../admin.module.css';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

type ProductForm = {
  name: string;
  price: string;
  unit: Product['unit'];
  description: string;
  categoryId: string;
  stockQuantity: string;
  badge: string;
  isActive: boolean;
};

const emptyForm = (categoryId = ''): ProductForm => ({
  name: '',
  price: '',
  unit: 'kg',
  description: '',
  categoryId,
  stockQuantity: '',
  badge: '',
  isActive: true,
});

export default function AdminProductsPage() {
  const { products: productList, categories, isLoading, error, refreshCatalog } = useProductCatalog();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setActionError('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: String(product.price),
      unit: product.unit,
      description: product.description,
      categoryId: product.categoryId,
      stockQuantity: String(product.stockQuantity),
      badge: product.badge || '',
      isActive: product.isActive,
    });
    setImagePreview(product.imageUrl);
    setImageFile(null);
    setActionError('');
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm(categories[0]?.id));
    setImageFile(null);
    setImagePreview('');
    setActionError('');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setActionError('');
    try {
      await api.deleteProduct(id);
      await refreshCatalog();
    } catch (nextError: unknown) {
      setActionError(nextError instanceof Error ? nextError.message : 'Unable to delete this product.');
    }
  };

  const [search, setSearch] = useState('');
  const visibleProducts = productList.filter((p) =>
    !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const toggleVisibility = async (product: Product) => {
    setActionError('');
    try {
      await api.updateProduct(product.id, { isActive: !product.isActive });
      await refreshCatalog();
    } catch (nextError: unknown) {
      setActionError(nextError instanceof Error ? nextError.message : 'Unable to update this product.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionError('');
    setIsSaving(true);

    let imageUrl: string | undefined;

    // Upload image if selected
    if (imageFile) {
      setIsUploading(true);
      try {
        imageUrl = await api.uploadImage(imageFile, 'products');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to upload image.');
        setIsSaving(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const productData: Partial<Product> = {
      name: form.name,
      price: Number(form.price),
      unit: form.unit,
      description: form.description,
      categoryId: form.categoryId,
      stockQuantity: Number(form.stockQuantity),
      // Send an empty string so a removed badge is actually cleared
      badge: form.badge.trim(),
      isActive: form.isActive,
      ...(imageUrl ? { imageUrl } : {}),
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
      } else {
        await api.createProduct(productData);
      }
      await refreshCatalog();
      closeForm();
    } catch (nextError: unknown) {
      setActionError(nextError instanceof Error ? nextError.message : 'Unable to save this product.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>Changes are published to the storefront immediately.</p>
        </div>
        <button className={styles.addBtn} onClick={handleCreate} disabled={categories.length === 0}>
          + Add Product
        </button>
      </div>

      {actionError && <p className={styles.formError}>{actionError}</p>}

      <input
        className={ui.search}
        type="search"
        placeholder={`Search ${productList.length} products…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showForm && (
        <div className={styles.modalBackdrop} onClick={closeForm}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className={styles.modalClose} onClick={closeForm} disabled={isSaving}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="product-name">Product Name</label>
                  <input id="product-name" type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required disabled={isSaving} />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="product-category">Category</label>
                  <select id="product-category" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required disabled={isSaving}>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="product-price">Price (₹)</label>
                  <input id="product-price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required disabled={isSaving} />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="product-unit">Unit</label>
                  <select id="product-unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value as Product['unit'] })} disabled={isSaving}>
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                    <option value="packet">packet</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="product-stock">Stock Quantity</label>
                  <input id="product-stock" type="number" min="0" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })} required disabled={isSaving} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="product-badge">Badge (optional)</label>
                  <input id="product-badge" type="text" placeholder="e.g. Bestseller, Pure" value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} disabled={isSaving} />
                </div>
              </div>
              <label className={ui.toggleRow}>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} disabled={isSaving} />
                Visible in store
              </label>
              <div className={styles.inputGroup}>
                <label htmlFor="product-description">Description</label>
                <textarea id="product-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required disabled={isSaving} />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="product-image">Product Image</label>
                <input id="product-image" type="file" accept="image/*" onChange={handleImageChange} disabled={isSaving} />
                {imagePreview && (
                  <div className={styles.imagePreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview of the file being uploaded */}
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeForm} disabled={isSaving}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isUploading ? 'Uploading image...' : isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Actions</span>
        </div>
        {isLoading ? (
          <p className={styles.tableMessage}>Loading products...</p>
        ) : error ? (
          <div className={styles.tableMessage}>
            <p>{error}</p>
            <button className={styles.editBtn} onClick={() => void refreshCatalog()}>Try again</button>
          </div>
        ) : visibleProducts.map((product) => (
          <div key={product.id} className={styles.tableRow}>
            <div className={styles.productCell}>
              <Image src={product.imageUrl} alt={product.name} width={48} height={48} className={styles.productThumb} />
              <div>
                <strong>{product.name}</strong>
                <small>
                  {product.slug}
                  {!product.isActive && <span className={`${ui.badge} ${ui.badgeMuted}`} style={{ marginLeft: 6 }}>Hidden</span>}
                  {product.stockQuantity === 0 && <span className={`${ui.badge} ${ui.badgeWarn}`} style={{ marginLeft: 6 }}>Out of stock</span>}
                </small>
              </div>
            </div>
            <span>{categories.find((category) => category.id === product.categoryId)?.name || '—'}</span>
            <span className={styles.priceCell}>{formatCurrency(product.price)}/{product.unit}</span>
            <span className={product.stockQuantity < 40 ? styles.lowStock : ''}>{product.stockQuantity} {product.unit}</span>
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => handleEdit(product)}>Edit</button>
              <button className={styles.editBtn} onClick={() => void toggleVisibility(product)}>
                {product.isActive ? 'Hide' : 'Show'}
              </button>
              <button className={styles.deleteBtn} onClick={() => void handleDelete(product.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
