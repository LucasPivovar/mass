import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import logoImage from '../assets/logo_massflow.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Register = ({ onLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1 data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 & 3 data
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  // Dummy token for final login
  const [tempToken, setTempToken] = useState('');

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/register`, { username: name, password });
      setTempToken(response.data.token);
      setStep(2);
      toast.success('Cadastro inicial realizado. Um código foi enviado para seu e-mail.');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao realizar o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Simulating email 2FA verification
      await new Promise(resolve => setTimeout(resolve, 800));
      if (emailCode.length === 6) {
        setStep(3);
        toast.success('E-mail verificado! Enviamos agora um código SMS para o seu celular.');
      } else {
        setError('Código inválido. Digite os 6 dígitos.');
      }
    } catch (err) {
      setError('Erro ao verificar código de e-mail.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Simulating phone 2FA verification
      await new Promise(resolve => setTimeout(resolve, 800));
      if (phoneCode.length === 6) {
        toast.success('Cadastro concluído com sucesso!');
        // Success! Log the user in
        onLogin(tempToken);
      } else {
        setError('Código inválido. Digite os 6 dígitos.');
      }
    } catch (err) {
      setError('Erro ao verificar código SMS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-outer" style={styles.outerContainer}>
      <div style={styles.glowBlob1} />
      <div style={styles.glowBlob2} />

      <div className="auth-container" style={styles.authContainer}>
        {/* Brand Header */}
        <div style={styles.brandHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={logoImage} 
              alt="MassFlow Logo" 
              style={{ height: '60px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* Stepper Indicator */}
        <div style={styles.stepperContainer}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ 
              flex: 1,
              height: '6px', 
              background: step === i 
                ? 'var(--accent-flow)' 
                : step > i 
                  ? 'var(--accent-primary)' 
                  : 'rgba(255,255,255,0.06)',
              borderRadius: '99px',
              boxShadow: step >= i ? '0 0 10px rgba(94, 255, 0, 0.3)' : 'none',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', padding: '0 5px' }}>
          <span style={{ flex: 1, textAlign: 'center', color: step >= 1 ? '#5EFF00' : 'inherit' }}>Dados</span>
          <span style={{ flex: 1, textAlign: 'center', color: step >= 2 ? '#5EFF00' : 'inherit' }}>E-mail</span>
          <span style={{ flex: 1, textAlign: 'center', color: step >= 3 ? '#5EFF00' : 'inherit' }}>Celular</span>
        </div>

        {success && <p className="success-message" style={styles.success}>{success}</p>}
        {error && <p className="error-message" style={styles.error}>{error}</p>}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} style={styles.form}>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label style={styles.label}>Nome Completo</label>
              <div style={{ position: 'relative' }}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Seu nome"
                  style={{ ...styles.input, paddingLeft: '2.8rem' }}
                  required 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label style={styles.label}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="seu@email.com"
                  style={{ ...styles.input, paddingLeft: '2.8rem' }}
                  required 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label style={styles.label}>Celular</label>
              <div style={{ position: 'relative' }}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 .7 2.81A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </span>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.length > 11) v = v.slice(0, 11);
                    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                    if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                    setPhone(v);
                  }} 
                  placeholder="(11) 90000-0000"
                  style={{ ...styles.input, paddingLeft: '2.8rem' }}
                  required 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label style={styles.label}>Senha</label>
              <div style={{ position: 'relative' }}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Sua senha"
                  style={{ ...styles.input, paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                  required 
                />
                <button 
                  type="button" 
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeToggleBtn}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Processando...' : 'Próxima Etapa'}
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              )}
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Já tem uma conta? </span>
              <a href="/login" onClick={(e) => { e.preventDefault(); window.location.href = '/login'; }} style={styles.link}>
                Faça login
              </a>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} style={styles.form}>
            <div className="input-group" style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <label style={{ ...styles.label, textAlign: 'center' }}>Código de E-mail</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="input-2fa"
                  value={emailCode} 
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000"
                  required 
                />
              </div>
              <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '10px', textAlign: 'center' }}>
                Enviamos um código de 6 dígitos para {email || 'seu e-mail'}.
              </small>
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Verificando...' : 'Verificar E-mail'}
            </button>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button type="button" onClick={() => setStep(1)} style={styles.forgotLink}>
                Voltar e editar dados
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} style={styles.form}>
            <div className="input-group" style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <label style={{ ...styles.label, textAlign: 'center' }}>Código SMS</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="input-2fa"
                  value={phoneCode} 
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000"
                  required 
                />
              </div>
              <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '10px', textAlign: 'center' }}>
                Enviamos um código SMS de 6 dígitos para {phone || 'seu celular'}.
              </small>
            </div>
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Concluindo...' : 'Finalizar Cadastro'}
            </button>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button type="button" onClick={() => setStep(2)} style={styles.forgotLink}>
                Voltar
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

const styles = {
  outerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100vh',
    padding: '1.5rem',
    boxSizing: 'border-box',
    background: 'radial-gradient(circle at 50% 20%, #040503 0%, #000000 100%)',
    position: 'relative',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  glowBlob1: {
    position: 'absolute',
    width: '380px',
    height: '380px',
    borderRadius: '50%',
    background: 'rgba(94, 255, 0, 0.01)',
    filter: 'blur(100px)',
    top: '5%',
    left: '5%',
    pointerEvents: 'none',
    animation: 'blobFloat 15s infinite ease-in-out alternate'
  },
  glowBlob2: {
    position: 'absolute',
    width: '380px',
    height: '380px',
    borderRadius: '50%',
    background: 'rgba(63, 168, 0, 0.01)',
    filter: 'blur(100px)',
    bottom: '5%',
    right: '5%',
    pointerEvents: 'none',
    animation: 'blobFloat 18s infinite ease-in-out alternate-reverse'
  },
  authContainer: {
    background: 'rgba(4, 5, 3, 0.97)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    boxShadow: '0 30px 70px rgba(0,0,0,0.98)',
    borderRadius: 'var(--radius-lg)',
    padding: '3.5rem 3rem',
    maxWidth: '460px',
    width: '100%',
    margin: '0 auto',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10
  },
  brandHeader: {
    marginTop: '2rem',
    marginBottom: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    margin: '0 0 0.35rem 0',
    color: '#E5E5E5',
    letterSpacing: '-0.03em'
  },
  subtitle: {
    fontSize: '0.83rem',
    color: '#6B7280',
    margin: 0,
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  stepperContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '0.5rem',
    padding: '0 10px'
  },
  form: {
    textAlign: 'left'
  },
  label: {
    color: '#9CA3AF',
    fontSize: '0.8rem',
    fontWeight: '700',
    letterSpacing: '0.05em'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(8, 14, 5, 0.8)',
    borderColor: 'rgba(94, 255, 0, 0.1)'
  },
  error: {
    margin: '0 0 1.5rem 0'
  },
  success: {
    margin: '0 0 1.5rem 0'
  },
  button: {
    width: '100%',
    borderRadius: 'var(--radius-sm)',
    padding: '1rem 2rem',
    fontSize: '0.95rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #5EFF00 0%, #3FA800 100%)',
    color: '#000',
    border: 'none',
    boxShadow: '0 8px 28px rgba(94,255,0,0.28)',
    cursor: 'pointer',
    marginTop: '0.5rem',
    letterSpacing: '-0.01em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px'
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
    opacity: 0.8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 'auto',
    margin: 0
  },
  link: {
    color: '#5EFF00',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s',
    fontSize: '0.85rem'
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#5EFF00',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    boxShadow: 'none',
    transition: 'opacity 0.2s'
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#5EFF00',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    boxShadow: 'none',
    padding: 0
  }
};

export default Register;
