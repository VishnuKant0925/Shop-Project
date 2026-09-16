'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Service } from '@/types';
import styles from '../products/page.module.css';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

type ServiceForm = {
  name: string;
  rate: string;
  rateUnit: string;
  description: string;
  icon: string;
  features: string;
};

const emptyForm = (): ServiceForm => ({
  name: '',
  rate: '',
  rateUnit: '',
  description: '',
  icon: '⚙️',
  features: '',
});

export default function AdminServicesPage() {
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const data = await api.getServices();
      setServiceList(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const closeForm = () => {
    setShowForm(false);
    setEditingService(null);
    setActionError('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      rate: String(service.rate),
      rateUnit: service.rateUnit,
      description: service.description,
      icon: service.icon,
      features: service.features.join(', '),
    });
    setImagePreview(service.imageUrl);
    setImageFile(null);
    setActionError('');
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setForm(emptyForm());
    setImageFile(null);
    setImagePreview('');
    setActionError('');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    setActionError('');
    try {
      await api.deleteService(id);
      await fetchServices();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete this service.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setIsSaving(true);

    let imageUrl: string | undefined;

    // Upload image if selected
    if (imageFile) {
      setIsUploading(true);
      try {
        imageUrl = await api.uploadImage(imageFile, 'services');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to upload image.');
        setIsSaving(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const serviceData: Partial<Service> = {
      name: form.name,
      rate: Number(form.rate),
      rateUnit: form.rateUnit,
      description: form.description,
      icon: form.icon || '⚙️',
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      ...(imageUrl ? { imageUrl } : {}),
    };

    try {
      if (editingService) {
        await api.updateService(editingService.id, serviceData);
      } else {
        await api.createService(serviceData);
      }
      await fetchServices();
      closeForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save this service.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Services</h1>
          <p className={styles.subtitle}>Manage milling services and rates</p>
        </div>
        <button className={styles.addBtn} onClick={handleCreate}>
          + Add Service
        </button>
      </div>

      {actionError && <p className={styles.formError}>{actionError}</p>}

      {showForm && (
        <div className={styles.modalBackdrop} onClick={closeForm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button className={styles.modalClose} onClick={closeForm} disabled={isSaving}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Service Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={isSaving} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Rate (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required disabled={isSaving} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Rate Unit</label>
                  <input type="text" placeholder="e.g., per kg" value={form.rateUnit} onChange={(e) => setForm({ ...form, rateUnit: e.target.value })} required disabled={isSaving} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Icon (emoji)</label>
                  <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} disabled={isSaving} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required disabled={isSaving} />
              </div>
              <div className={styles.inputGroup}>
                <label>Features (comma separated)</label>
                <input type="text" placeholder="Feature 1, Feature 2, ..." value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} disabled={isSaving} />
              </div>
              <div className={styles.inputGroup}>
                <label>Service Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} disabled={isSaving} />
                {imagePreview && (
                  <div className={styles.imagePreview}>
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeForm} disabled={isSaving}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isUploading ? 'Uploading image...' : isSaving ? 'Saving...' : editingService ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1fr 1fr 120px' }}>
          <span>Service</span>
          <span>Rate</span>
          <span>Rate Unit</span>
          <span>Actions</span>
        </div>
        {isLoading ? (
          <p className={styles.tableMessage}>Loading services...</p>
        ) : error ? (
          <div className={styles.tableMessage}>
            <p>{error}</p>
            <button className={styles.editBtn} onClick={() => void fetchServices()}>Try again</button>
          </div>
        ) : serviceList.length === 0 ? (
          <p className={styles.tableMessage}>No services found. Add your first service!</p>
        ) : (
          serviceList.map((service) => (
            <div key={service.id} className={styles.tableRow} style={{ gridTemplateColumns: '2fr 1fr 1fr 120px' }}>
              <div>
                <strong>{service.icon} {service.name}</strong>
              </div>
              <span className={styles.priceCell}>{formatCurrency(service.rate)}</span>
              <span>{service.rateUnit}</span>
              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => handleEdit(service)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => void handleDelete(service.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
