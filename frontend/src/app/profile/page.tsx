'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const updateData: { name?: string; phone?: string; password?: string } = {};

      if (name.trim() !== user.name) updateData.name = name.trim();
      if (phone.trim() !== (user.phone || '')) updateData.phone = phone.trim();

      if (showPasswordSection && newPassword) {
        if (newPassword.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          setIsSaving(false);
          return;
        }
        updateData.password = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage('No changes to save.');
        setIsSaving(false);
        return;
      }

      await api.updateProfile(updateData);
      refreshUser();
      setMessage('Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        {/* Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'white' }}>
              person
            </span>
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerName}>{user.name}</h1>
            <p className={styles.headerEmail}>{user.email}</p>
            <span className={styles.roleBadge}>
              {user.role === 'admin' ? '👑 Administrator' : '👤 Customer'}
            </span>
          </div>
        </div>

        {/* Messages */}
        {message && <div className={styles.successMsg}>{message}</div>}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Profile Form */}
        <form onSubmit={handleProfileUpdate} className={styles.form}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>

            <div className={styles.inputGroup}>
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
                className={styles.disabledInput}
              />
              <small className={styles.helpText}>Email cannot be changed</small>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="profile-phone">Phone Number</label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Password Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Password</h2>
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <div className={styles.passwordFields}>
                <div className={styles.inputGroup}>
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    disabled={isSaving}
                    minLength={6}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
