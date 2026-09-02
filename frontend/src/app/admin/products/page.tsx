'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { products as initialProducts, categories, formatCurrency } from '@/data';
import { Product } from '@/types';
import styles from './page.module.css';

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '', price: '', unit: 'kg', description: '', categoryId: 'cat-1', stockQuantity: '',
  });

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
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProductList(productList.filter((p) => p.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProductList(productList.map((p) =>
        p.id === editingProduct.id
          ? { ...p, name: form.name, price: Number(form.price), unit: form.unit as Product['unit'], description: form.description, stockQuantity: Number(form.stockQuantity) }
          : p
      ));
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        price: Number(form.price),
        unit: form.unit as Product['unit'],
        description: form.description,
        categoryId: form.categoryId,
        stockQuantity: Number(form.stockQuantity),
        imageUrl: '/images/red-chili-powder.jpg',
        isActive: true,
      };
      setProductList([...productList, newProduct]);
    }
    setShowForm(false);
    setEditingProduct(null);
    setForm({ name: '', price: '', unit: 'kg', description: '', categoryId: 'cat-1', stockQuantity: '' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>Manage your product catalog</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditingProduct(null); setForm({ name: '', price: '', unit: 'kg', description: '', categoryId: 'cat-1', stockQuantity: '' }); }}>
          + Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className={styles.modalBackdrop} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Product Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="litre">litre</option>
                    <option value="packet">packet</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Stock Quantity</label>
                  <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>{editingProduct ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Actions</span>
        </div>
        {productList.map((product) => (
          <div key={product.id} className={styles.tableRow}>
            <div className={styles.productCell}>
              <Image src={product.imageUrl} alt={product.name} width={48} height={48} className={styles.productThumb} />
              <div>
                <strong>{product.name}</strong>
                <small>{product.slug}</small>
              </div>
            </div>
            <span>{categories.find((c) => c.id === product.categoryId)?.name || '—'}</span>
            <span className={styles.priceCell}>{formatCurrency(product.price)}/{product.unit}</span>
            <span className={product.stockQuantity < 40 ? styles.lowStock : ''}>{product.stockQuantity} {product.unit}</span>
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => handleEdit(product)}>Edit</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(product.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
