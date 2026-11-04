'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useProductCatalog } from '@/context/ProductCatalogContext';
import { Category } from '@/types';
import styles from '../admin.module.css';

export default function AdminCategoriesPage() {
  const { categories, products, refreshCatalog, isLoading } = useProductCatalog();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const countFor = (id: string) => products.filter((p) => p.categoryId === id).length;

  const open = (category: Category | null) => {
    setEditing(category);
    setName(category?.name || '');
    setDescription(category?.description || '');
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await api.updateCategory(editing.id, { name: name.trim(), description: description.trim() });
      else await api.createCategory({ name: name.trim(), description: description.trim() });
      await refreshCatalog();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete the category "${category.name}"?`)) return;
    try {
      await api.deleteCategory(category.id);
      await refreshCatalog();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not delete category');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>Group products into the filters shown in the store</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => open(null)}>+ New category</button>
      </div>

      {isLoading ? (
        <div className={styles.empty}>Loading…</div>
      ) : categories.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>No categories yet. Create one before adding products.</div>
      ) : (
        <div className={styles.list}>
          {categories.map((c) => {
            const count = countFor(c.id);
            return (
              <div key={c.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{c.name}</div>
                  <div className={styles.rowMeta}>
                    {count} product{count === 1 ? '' : 's'} · /{c.slug}
                    {c.description ? ` · ${c.description}` : ''}
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button type="button" className={styles.btn} onClick={() => open(c)}>Edit</button>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => handleDelete(c)}
                    disabled={count > 0}
                    title={count > 0 ? 'Move or delete its products first' : undefined}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className={styles.modalBackdrop} onClick={() => setShowForm(false)}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2 className={styles.modalTitle}>{editing ? 'Edit category' : 'New category'}</h2>
            {error && <div className={styles.error} style={{ marginBottom: 12 }}>{error}</div>}
            <div className={styles.form}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label htmlFor="cat-name">Name</label>
                <input id="cat-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label htmlFor="cat-desc">Description</label>
                <input id="cat-desc" maxLength={160} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
