'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/data';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import { api } from '@/lib/api';
import { Product } from '@/types';
import styles from './page.module.css';

type ProductForm = {
  name: string;
  price: string;
  unit: Product['unit'];
  description: string;
  categoryId: string;
  stockQuantity: string;
};

const emptyForm = (categoryId = ''): ProductForm => ({
  name: '',
  price: '',
  unit: 'kg',
  description: '',
  categoryId,
  stockQuantity: '',
});

export default function AdminProductsPage() {
  const { products: productList, categories, isLoading, error, refreshCatalog } = useProductCatalog();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setActionError('');
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
    });
    setActionError('');
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm(categories[0]?.id));
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionError('');
    setIsSaving(true);

    const productData: Partial<Product> = {
      name: form.name,
      price: Number(form.price),
      unit: form.unit,
      description: form.description,
      categoryId: form.categoryId,
      stockQuantity: Number(form.stockQuantity),
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
              <div className={styles.inputGroup}>
                <label htmlFor="product-description">Description</label>
                <textarea id="product-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required disabled={isSaving} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeForm} disabled={isSaving}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
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
        ) : productList.map((product) => (
          <div key={product.id} className={styles.tableRow}>
            <div className={styles.productCell}>
              <Image src={product.imageUrl} alt={product.name} width={48} height={48} className={styles.productThumb} />
              <div>
                <strong>{product.name}</strong>
                <small>{product.slug}</small>
              </div>
            </div>
            <span>{categories.find((category) => category.id === product.categoryId)?.name || '—'}</span>
            <span className={styles.priceCell}>{formatCurrency(product.price)}/{product.unit}</span>
            <span className={product.stockQuantity < 40 ? styles.lowStock : ''}>{product.stockQuantity} {product.unit}</span>
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => handleEdit(product)}>Edit</button>
              <button className={styles.deleteBtn} onClick={() => void handleDelete(product.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
