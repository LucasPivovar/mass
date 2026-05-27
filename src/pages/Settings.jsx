import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Settings = ({ token }) => {
  const [settings, setSettings] = useState({
    messaging_provider: 'twilio',
    base_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Twilio Multiple Accounts State
  const [twilioAccounts, setTwilioAccounts] = useState([]);
  const [showTwilioForm, setShowTwilioForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [twilioForm, setTwilioForm] = useState({
    friendly_name: '',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: ''
  });

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setSettings({
          messaging_provider: 'twilio',
          base_url: response.data.base_url || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings', err);
      setError('Erro ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTwilioAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/twilio-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwilioAccounts(response.data);
    } catch (err) {
      console.error('Error fetching Twilio accounts', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchTwilioAccounts();
  }, [token]);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleProviderChange = (provider) => {
    setSettings({ ...settings, messaging_provider: provider });
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post(`${API_BASE}/api/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Configurações gerais salvas com sucesso!');
    } catch (err) {
      setError('Erro ao salvar configurações.');
    }
  };

  // Twilio Accounts Actions
  const handleTwilioFormChange = (e) => {
    setTwilioForm({ ...twilioForm, [e.target.name]: e.target.value });
  };

  const handleOpenNewForm = () => {
    setEditingAccount(null);
    setTwilioForm({
      friendly_name: '',
      twilio_account_sid: '',
      twilio_auth_token: '',
      twilio_phone_number: ''
    });
    setShowTwilioForm(true);
    setMessage('');
    setError('');
  };

  const handleOpenEditForm = (account) => {
    setEditingAccount(account);
    setTwilioForm({
      friendly_name: account.friendly_name,
      twilio_account_sid: account.twilio_account_sid,
      twilio_auth_token: '********', // masked token
      twilio_phone_number: account.twilio_phone_number
    });
    setShowTwilioForm(true);
    setMessage('');
    setError('');
  };

  const handleCancelTwilioForm = () => {
    setShowTwilioForm(false);
    setEditingAccount(null);
    setTwilioForm({
      friendly_name: '',
      twilio_account_sid: '',
      twilio_auth_token: '',
      twilio_phone_number: ''
    });
  };

  const handleSaveTwilioAccount = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!twilioForm.friendly_name || !twilioForm.twilio_account_sid || !twilioForm.twilio_auth_token || !twilioForm.twilio_phone_number) {
      setError('Todos os campos do perfil do Twilio são obrigatórios.');
      return;
    }

    try {
      if (editingAccount) {
        // Edit existing twilio account
        await axios.put(`${API_BASE}/api/twilio-accounts/${editingAccount.id}`, twilioForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`Perfil "${twilioForm.friendly_name}" atualizado com sucesso!`);
      } else {
        // Create new twilio account
        await axios.post(`${API_BASE}/api/twilio-accounts`, twilioForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage(`Perfil "${twilioForm.friendly_name}" cadastrado com sucesso!`);
      }

      handleCancelTwilioForm();
      fetchTwilioAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar perfil do Twilio.');
    }
  };

  const handleDeleteTwilioAccount = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja excluir o perfil "${name}"?`)) return;

    setMessage('');
    setError('');
    try {
      await axios.delete(`${API_BASE}/api/twilio-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Perfil "${name}" excluído com sucesso.`);
      fetchTwilioAccounts();
    } catch (err) {
      setError('Erro ao excluir perfil da Twilio.');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Carregando configurações...</h2>
      </div>
    );
  }

  return (
    <div className="page-container pulse-glow">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>Configurações</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0 }}>
          Defina o provedor de mensageria ativo, integre múltiplos perfis do Twilio e defina sua URL de webhook.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main Twilio Settings (Provider & Webhook url) */}
          <form onSubmit={handleSubmit} style={styles.formContainer}>
            <h2 style={styles.sectionHeader}>Configurações Gerais Twilio</h2>
            
            <div className="input-group">
              <label>URL Base da API (Hospedagem & Webhooks)</label>
              <input 
                type="text" 
                name="base_url"
                value={settings.base_url} 
                onChange={handleChange} 
                placeholder="https://seu-dominio.com.br"
              />
              <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '6px' }}>
                URL de callbacks e hospedagem de mídias anexadas nas mensagens enviadas.
              </small>
            </div>

            {error && !showTwilioForm && <p className="error-message">{error}</p>}
            {message && !showTwilioForm && <p className="success-message">{message}</p>}

            <button type="submit" style={{ marginTop: '1.5rem', width: '100%', borderRadius: 'var(--radius-sm)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Salvar
            </button>
          </form>

          {/* New Preferences Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Security Settings */}
            <div style={styles.formContainer}>
              <h2 style={{ ...styles.sectionHeader, fontSize: '1.15rem', marginBottom: '1.5rem' }}>Segurança</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>Autenticação 2FA</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Exigir código por SMS/E-mail no login</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>Alerta de Novo Dispositivo</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Notificar quando logar de outro IP</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            {/* Notifications Settings */}
            <div style={styles.formContainer}>
              <h2 style={{ ...styles.sectionHeader, fontSize: '1.15rem', marginBottom: '1.5rem' }}>Alertas & Notificações</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>Fim de Campanha</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>E-mail ao terminar lote de disparos</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem' }}>Alerta de Saldo Baixo</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Avisar quando saldo for &lt; R$ 50,00</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Twilio Add/Edit Card Form */}
          {showTwilioForm && (
            <form onSubmit={handleSaveTwilioAccount} style={{ ...styles.formContainer, border: '1px solid rgba(94, 255, 0, 0.4)', boxShadow: '0 0 20px rgba(94,255,0,0.1)' }}>
              <h2 style={{ ...styles.sectionHeader, background: 'var(--accent-flow)', padding: '0.2rem 0' }}>
                {editingAccount ? `Editar Perfil: ${editingAccount.friendly_name}` : 'Cadastrar Novo Perfil Twilio'}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Nome Amigável do Perfil</label>
                  <input 
                    type="text" 
                    name="friendly_name"
                    value={twilioForm.friendly_name} 
                    onChange={handleTwilioFormChange} 
                    placeholder="Ex: Suporte Principal, Canal Vendas"
                    required
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label>Account SID</label>
                  <input 
                    type="text" 
                    name="twilio_account_sid"
                    value={twilioForm.twilio_account_sid} 
                    onChange={handleTwilioFormChange} 
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Auth Token</label>
                  <input 
                    type="password" 
                    name="twilio_auth_token"
                    value={twilioForm.twilio_auth_token} 
                    onChange={handleTwilioFormChange} 
                    placeholder={editingAccount ? "Preencha para alterar o token" : "Seu Twilio Auth Token"}
                    required
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label>Número do WhatsApp Twilio</label>
                  <input 
                    type="text" 
                    name="twilio_phone_number"
                    value={twilioForm.twilio_phone_number} 
                    onChange={handleTwilioFormChange} 
                    placeholder="Ex: +14155238886"
                    required
                  />
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" style={{ flex: 1, borderRadius: 'var(--radius-sm)' }}>
                  Salvar Perfil
                </button>
                <button type="button" onClick={handleCancelTwilioForm} className="secondary" style={{ flex: 1, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Twilio Profiles List */}
          <div style={styles.formContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', background: 'var(--accent-flow)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Perfis do Twilio Cadastrados
              </h2>
              {!showTwilioForm && (
                <button type="button" onClick={handleOpenNewForm} style={{ padding: '0.7rem 1.4rem', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Novo Perfil Twilio
                </button>
              )}
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome Amigável</th>
                    <th>Account SID</th>
                    <th>Telefone / WhatsApp</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {twilioAccounts.map(acc => (
                    <tr key={acc.id}>
                      <td style={{ fontWeight: '700', color: 'white' }}>{acc.friendly_name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {acc.twilio_account_sid.substring(0, 12)}...
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>
                        {acc.twilio_phone_number}
                      </td>
                      <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenEditForm(acc)}
                          style={styles.actionBtn}
                          title="Editar Perfil"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteTwilioAccount(acc.id, acc.friendly_name)}
                          style={{ ...styles.actionBtn, color: '#ef4444' }}
                          title="Excluir Perfil"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {twilioAccounts.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                        Nenhum perfil de conta Twilio cadastrado. Clique em "+ Novo Perfil Twilio" para começar!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
    </div>
  );
};

const styles = {
  formContainer: {
    background: 'none',
    border: 'none',
    padding: '0',
    boxShadow: 'none',
    marginBottom: '2rem'
  },
  sectionHeader: {
    marginTop: 0,
    marginBottom: '2rem',
    fontSize: '1.25rem',
    background: 'var(--accent-flow)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
    fontWeight: '800'
  },
  actionBtn: {
    background: 'transparent',
    padding: '0.4rem',
    color: 'var(--accent-secondary)',
    border: 'none',
    boxShadow: 'none',
    minWidth: 'auto',
    display: 'inline-flex',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '8px'
  }
};

export default Settings;
