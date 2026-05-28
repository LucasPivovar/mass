import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Campaigns = ({ token }) => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Actions Ellipsis Dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const campaignsPerPage = 10;

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  useEffect(() => {
    const closeDropdowns = () => setActiveDropdownId(null);
    window.addEventListener('click', closeDropdowns);
    return () => window.removeEventListener('click', closeDropdowns);
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data);
    } catch (err) {
      console.error('Error fetching campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchCampaigns, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Filter logic
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Pagination Helper Calculations
  const totalPages = Math.max(Math.ceil(filteredCampaigns.length / campaignsPerPage), 1);

  // Safety check: if currentPage exceeds totalPages, adjust it
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredCampaigns.length, totalPages, currentPage]);

  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * campaignsPerPage,
    currentPage * campaignsPerPage
  );

  const handleResend = async (c) => {
    if (!window.confirm(`Deseja realmente reenviar a campanha "${c.name}" para os mesmos contatos?`)) return;
    try {
      await axios.post(`${API_BASE}/api/campaigns/${c.id}/resend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Campanha reenviada com sucesso!');
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao reenviar campanha.');
    }
  };

  const handleUpdateStatus = async (c, newStatus) => {
    let verb = 'atualizar';
    if (newStatus === 'paused') verb = 'pausar';
    if (newStatus === 'stopped') verb = 'parar ou cancelar';
    if (newStatus === 'sending') verb = 'retomar';

    if (!window.confirm(`Deseja realmente ${verb} a campanha "${c.name}"?`)) return;
    try {
      await axios.post(`${API_BASE}/api/campaigns/${c.id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCampaigns();
    } catch (err) {
      alert('Erro ao atualizar status da campanha.');
    }
  };

  const renderStatusBadge = (status, date, time) => {
    switch (status) {
      case 'completed':
        return (
          <span className="badge delivered" style={{ whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Concluída
          </span>
        );
      case 'sending':
        return (
          <span className="badge" style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            animation: 'pulseGlow 2s infinite ease-in-out',
            whiteSpace: 'nowrap'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Enviando
          </span>
        );
      case 'scheduled':
        return (
          <span className="badge" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            whiteSpace: 'nowrap'
          }} title={`Agendado para ${date} às ${time}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Agendada
          </span>
        );
      case 'paused':
        return (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Pausada
          </span>
        );
      case 'stopped':
        return (
          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            </svg>
            Parada
          </span>
        );
      default:
        return <span className="badge queued" style={{ whiteSpace: 'nowrap' }}>{status}</span>;
    }
  };

  const renderVariables = (variablesStr) => {
    try {
      const vars = JSON.parse(variablesStr || '{}');
      if (Object.keys(vars).length === 0) return <em style={{ color: 'var(--text-tertiary)' }}>Nenhuma variável configurada</em>;
      return Object.entries(vars).map(([key, val]) => (
        <div key={key} style={{ marginBottom: '8px', fontSize: '0.85rem', display: 'flex', gap: '6px' }}>
          <strong style={{ color: 'var(--accent-secondary)' }}>{`{{${key}}}`}:</strong>
          <span style={{ color: 'var(--text-primary)' }}>{val}</span>
        </div>
      ));
    } catch (e) {
      return <em style={{ color: '#ef4444' }}>Erro ao carregar variáveis</em>;
    }
  };

  return (
    <div className="page-container pulse-glow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Campanhas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0 }}>
            Acompanhe o desempenho, taxas de leitura e status em tempo real de cada disparo.
          </p>
        </div>
        <button onClick={() => navigate('/new-campaign')} style={{ width: 'auto' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          Nova Campanha
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconContainer}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <div>
            <span style={styles.statLabel}>Total de Campanhas</span>
            <h2 style={styles.statVal}>{campaigns.length}</h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, color: 'var(--accent-secondary)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <div>
            <span style={styles.statLabel}>Em Execução (Ativas)</span>
            <h2 style={{ ...styles.statVal, color: 'var(--accent-secondary)' }}>
              {campaigns.filter(c => c.status === 'sending').length}
            </h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, color: '#fbbf24' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div>
            <span style={styles.statLabel}>Agendadas</span>
            <h2 style={{ ...styles.statVal, color: '#fbbf24' }}>
              {campaigns.filter(c => c.status === 'scheduled').length}
            </h2>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filterSection}>
        <div style={styles.filterInputGroup}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Buscar campanha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="no-border-input"
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterInputGroup}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="no-border-select"
            style={styles.tagSelect}
          >
            <option value="">Status: Todos</option>
            <option value="sending">Em Execução</option>
            <option value="scheduled">Agendadas</option>
            <option value="paused">Pausadas</option>
            <option value="stopped">Paradas / Canceladas</option>
            <option value="completed">Concluídas</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Carregando dados das campanhas...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome da Campanha</th>
                <th>Provedor</th>
                <th>Data</th>
                <th>Envios</th>
                <th>Entregues</th>
                <th>Lidos</th>
                <th>Desempenho</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCampaigns.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '700', fontSize: '1.02rem' }}>
                    {c.name}
                    {c.contact_flag && (
                      <div style={{ marginTop: '5px' }}>
                        <span className="badge" style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                          </svg>
                          {c.contact_flag}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '99px',
                          background: c.template_sid ? 'var(--accent-indigo-light)' : 'rgba(255, 255, 255, 0.05)',
                          color: c.template_sid ? '#a7f3d0' : 'var(--text-secondary)',
                          border: c.template_sid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                          fontWeight: '700',
                          display: 'inline-block',
                          width: 'fit-content'
                        }}
                      >
                        {c.template_sid ? 'Twilio Template' : 'Padrão Custom'}
                      </span>
                      {c.template_sid && c.twilio_account_name && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', paddingLeft: '4px' }}>
                          Conta: {c.twilio_account_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{c.total_sent}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#ffffff', fontWeight: '800' }}>
                        {c.total_delivered}
                      </span>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        ({Math.round((c.total_delivered / c.total_sent) * 100) || 0}%)
                      </small>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#ffffff', fontWeight: '800' }}>
                        {c.total_read}
                      </span>
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        ({Math.round((c.total_read / c.total_sent) * 100) || 0}%)
                      </small>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center', fontSize: '0.98rem', fontWeight: '800', fontFamily: 'monospace' }}>
                      <span style={{ color: '#59e308' }}>{c.total_read}</span>
                      <span style={{ color: '#ffffff' }}>/{c.total_sent}</span>
                    </div>
                  </td>
                  <td>
                    {renderStatusBadge(c.status, c.scheduled_date, c.scheduled_time)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="actions-dropdown-container">
                      <button
                        onClick={(e) => toggleDropdown(c.id, e)}
                        className="actions-dropdown-trigger"
                        title="Ações da Campanha"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="5" r="1.5"></circle>
                          <circle cx="12" cy="12" r="1.5"></circle>
                          <circle cx="12" cy="19" r="1.5"></circle>
                        </svg>
                      </button>

                      {activeDropdownId === c.id && (
                        <div className="actions-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setSelectedCampaign(c); setActiveDropdownId(null); }}
                            className="actions-dropdown-item"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            Ver Mensagem
                          </button>

                          {/* Conditional control buttons for Pause, Stop, Resume */}
                          {c.status === 'sending' && (
                            <>
                              <button
                                onClick={() => { handleUpdateStatus(c, 'paused'); setActiveDropdownId(null); }}
                                className="actions-dropdown-item warning"
                                style={{ color: '#f59e0b' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="6" y="4" width="4" height="16"></rect>
                                  <rect x="14" y="4" width="4" height="16"></rect>
                                </svg>
                                Pausar
                              </button>
                              <button
                                onClick={() => { handleUpdateStatus(c, 'stopped'); setActiveDropdownId(null); }}
                                className="actions-dropdown-item danger"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                                </svg>
                                Parar
                              </button>
                            </>
                          )}

                          {c.status === 'paused' && (
                            <>
                              <button
                                onClick={() => { handleUpdateStatus(c, 'sending'); setActiveDropdownId(null); }}
                                className="actions-dropdown-item success"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Retomar
                              </button>
                              <button
                                onClick={() => { handleUpdateStatus(c, 'stopped'); setActiveDropdownId(null); }}
                                className="actions-dropdown-item danger"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                                </svg>
                                Parar
                              </button>
                            </>
                          )}

                          {c.status === 'scheduled' && (
                            <button
                              onClick={() => { handleUpdateStatus(c, 'stopped'); setActiveDropdownId(null); }}
                              className="actions-dropdown-item danger"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                              </svg>
                              Cancelar
                            </button>
                          )}

                          <button
                            onClick={() => { handleResend(c); setActiveDropdownId(null); }}
                            className="actions-dropdown-item"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 4 23 10 17 10"></polyline>
                              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            Reenviar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedCampaigns.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                    Nenhuma campanha encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {campaigns.length > campaignsPerPage && (
            <div style={styles.paginationContainer}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="secondary"
                style={styles.paginationBtn}
              >
                Anterior
              </button>
              <span style={styles.paginationInfo}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="secondary"
                style={styles.paginationBtn}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Glassmorphic para Visualizar a Mensagem */}
      {selectedCampaign && (
        <div className="modal-overlay" style={styles.modalOverlay}>
          <div className="modal-content-box" style={styles.modalContent}>
            {/* Fechar modal */}
            <button
              onClick={() => setSelectedCampaign(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>

            <h2 style={{ marginTop: 0, fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              Detalhes da Campanha
            </h2>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Campaign details */}
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={styles.detailLabel}>Nome da Campanha</label>
                  <p style={styles.detailText}>{selectedCampaign.name}</p>
                </div>

                <div>
                  <label style={styles.detailLabel}>Provedor Utilizado</label>
                  <p style={styles.detailText}>
                    {selectedCampaign.template_sid
                      ? `Twilio (${selectedCampaign.twilio_account_name || 'WhatsApp Oficial'})`
                      : 'Padrão (WhatsApp Web)'}
                  </p>
                </div>

                {selectedCampaign.template_sid && (
                  <div style={styles.variableBox}>
                    <label style={styles.detailLabel}>Variáveis Declaradas</label>
                    <div style={{ marginTop: '0.5rem' }}>
                      {renderVariables(selectedCampaign.template_variables)}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Mockup Preview */}
              <div style={{ width: '280px', flexShrink: 0 }}>
                <div style={styles.miniPhone}>
                  <div style={styles.miniPhoneScreen}>
                    <div style={styles.miniHeader}>
                      <span style={{ fontSize: '14px' }}>←</span>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Visualização de Envio</div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>online</div>
                      </div>
                    </div>

                    <div style={styles.miniBody}>
                      <div className="whatsapp-message-bubble" style={{ alignSelf: 'flex-end', fontSize: '0.82rem', padding: '8px 12px', borderRadius: '12px', borderTopRightRadius: '2px' }}>
                        {selectedCampaign.template_sid ? (
                          <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--accent-primary)', color: 'white', fontSize: '0.62rem', padding: '1px 6px', borderRadius: '99px', marginBottom: '6px', fontWeight: 'bold' }}>
                              TWILIO TEMPLATE
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px', wordBreak: 'break-all' }}>
                              SID: <code>{selectedCampaign.template_sid}</code>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {selectedCampaign.media_path && (
                              <div style={{ marginBottom: '8px' }}>
                                {selectedCampaign.media_path.match(/\.(mp4|avi|mov)$/i) ? (
                                  <video src={`${API_BASE}${selectedCampaign.media_path}`} controls style={{ width: '100%', borderRadius: '8px' }} />
                                ) : selectedCampaign.media_path.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img src={`${API_BASE}${selectedCampaign.media_path}`} alt="Anexo" style={{ width: '100%', borderRadius: '8px' }} />
                                ) : (
                                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📎 Anexo: {selectedCampaign.media_path.split('/').pop()}</div>
                                )}
                              </div>
                            )}
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#f1f5f9' }}>
                              {selectedCampaign.message_text || <span style={{ color: 'var(--text-tertiary)' }}>Sem mensagem</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  actionBtn: {
    padding: '0.45rem 0.9rem',
    fontSize: '0.8rem',
    borderRadius: '8px',
    boxShadow: 'none'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(3, 7, 18, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#090909',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '2.5rem',
    borderRadius: 'var(--radius-lg)',
    maxWidth: '650px',
    width: '90%',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), var(--shadow-glow)'
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    padding: '6px 10px',
    boxShadow: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem'
  },
  detailLabel: {
    color: 'var(--text-tertiary)',
    fontSize: '0.72rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '4px',
    textTransform: 'uppercase'
  },
  detailText: {
    color: 'var(--text-primary)',
    fontSize: '1.05rem',
    fontWeight: '600',
    margin: 0
  },
  variableBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)'
  },
  miniPhone: {
    width: '100%',
    height: '420px',
    backgroundColor: '#0c0f1a',
    borderRadius: '32px',
    padding: '8px',
    boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.5), 0 0 0 1.5px rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden'
  },
  miniPhoneScreen: {
    width: '100%',
    height: '100%',
    borderRadius: '26px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0b0e14',
    border: '1px solid rgba(255,255,255,0.03)'
  },
  miniHeader: {
    background: '#121b2d',
    color: 'white',
    padding: '20px 10px 8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  miniBody: {
    flex: 1,
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'radial-gradient(circle at 100% 100%, #15192b 0%, #0b0e14 100%)',
    overflowY: 'auto'
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1.25rem',
    borderTop: '1px solid var(--border-glass)',
    background: 'rgba(10, 15, 30, 0.2)'
  },
  paginationBtn: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.85rem',
    borderRadius: '8px',
    boxShadow: 'none',
    minWidth: '100px'
  },
  paginationInfo: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '600'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem'
  },
  statCard: {
    background: 'radial-gradient(circle at center, rgba(94, 255, 0, 0) 0%, rgba(10, 16, 6, 0.82) 100%)',
    border: '1px solid var(--border-glass)',
    borderRadius: '14px',
    padding: '1.5rem 1.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: 'var(--shadow-sm)'
  },
  statIconContainer: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.35rem',
    color: 'var(--accent-primary)'
  },
  statLabel: {
    display: 'block',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  statVal: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'white',
    letterSpacing: '-0.02em'
  },
  filterSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap'
  },
  filterInputGroup: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(10, 16, 6, 0.6)',
    padding: '0.6rem 1rem',
    borderRadius: '12px',
    flex: 1,
    minWidth: '200px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    padding: '0.25rem',
    fontSize: '0.88rem'
  },
  tagSelect: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
    fontSize: '0.88rem',
    padding: '0.25rem 0'
  }
};

export default Campaigns;
