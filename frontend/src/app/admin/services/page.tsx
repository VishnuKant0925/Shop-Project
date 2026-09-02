'use client';

import React, { useState } from 'react';
import { services as initialServices, formatCurrency } from '@/data';
import { Service } from '@/types';
import styles from '../products/page.module.css';

export default function AdminServicesPage() {
  const [serviceList, setServiceList] = useState<Service[]>(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', rate: '', rateUnit: '', description: '' });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setForm({ name: service.name, rate: String(service.rate), rateUnit: service.rateUnit, description: service.description });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this service?')) {
      setServiceList(serviceList.filter((s) => s.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      setServiceList(serviceList.map((s) =>
        s.id === editingService.id
          ? { ...s, name: form.name, rate: Number(form.rate), rateUnit: form.rateUnit, description: form.description }
          : s
      ));
    } else {
      const newService: Service = {
        id: `srv-${Date.now()}`,
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        rate: Number(form.rate),
        rateUnit: form.rateUnit,
        description: form.description,
        imageUrl: '/images/flour-milling.jpg',
        icon: '⚙️',
        isActive: true,
        features: ['Quality service'],
      };
      setServiceList([...serviceList, newService]);
    }
    setShowForm(false);
    setEditingService(null);
    setForm({ name: '', rate: '', rateUnit: '', description: '' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Services</h1>
          <p className={styles.subtitle}>Manage milling services and rates</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditingService(null); setForm({ name: '', rate: '', rateUnit: '', description: '' }); }}>
          + Add Service
        </button>
      </div>

      {showForm && (
        <div className={styles.modalBackdrop} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button className={styles.modalClose} onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Service Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label>Rate (₹)</label>
                  <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Rate Unit</label>
                  <input type="text" placeholder="e.g., per kg" value={form.rateUnit} onChange={(e) => setForm({ ...form, rateUnit: e.target.value })} required />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>{editingService ? 'Save Changes' : 'Add Service'}</button>
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
        {serviceList.map((service) => (
          <div key={service.id} className={styles.tableRow} style={{ gridTemplateColumns: '2fr 1fr 1fr 120px' }}>
            <div>
              <strong>{service.icon} {service.name}</strong>
            </div>
            <span className={styles.priceCell}>{formatCurrency(service.rate)}</span>
            <span>{service.rateUnit}</span>
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => handleEdit(service)}>Edit</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(service.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
