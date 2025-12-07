import React, { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  type: 'login' | 'signup';
  onAuthSuccess?: () => void; // Made optional
}

export default function AuthForm({ type, onAuthSuccess }: AuthFormProps) {
  const isSignUp = type === 'signup';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [software, setSoftware] = useState('');
  const [hardware, setHardware] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
          // @ts-ignore
          software,
          hardware
        });
        if (error) throw error;
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password
        });
        if (error) throw error;
      }
      setSuccessMessage('Authentication successful! Redirecting...');
      onAuthSuccess?.(); // Call optional success handler
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPageWrapper}>
      <div className={styles.authContainer}>
        <h3>{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && (
          <div className={styles.inputGroup}>
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
        )}
        <div className={styles.inputGroup}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className={styles.inputGroup}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        {isSignUp && (
          <div className={styles.inputGroup}>
            <label>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
        )}
        
        {isSignUp && (
          <>
            <div className={styles.inputGroup}>
              <label>What software do you use?</label>
              <input type="text" value={software} onChange={e => setSoftware(e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label>What hardware do you use?</label>
              <input type="text" value={hardware} onChange={e => setHardware(e.target.value)} required />
            </div>
          </>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>
      </div>
    </div>
  );
}

