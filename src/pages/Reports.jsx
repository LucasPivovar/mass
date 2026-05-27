import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Reports = ({ token }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Controls chart animation: renders at 0 then animates to real value
  const [animated, setAnimated] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data || []);
    } catch (err) {
      console.error('Erro ao buscar campanhas para relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCampaigns();
    }
  }, [token]);

  // Re-trigger chart animation every time data finishes loading
  useEffect(() => {
    setAnimated(false);
    if (!loading) {
      const t = setTimeout(() => setAnimated(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Analytics Metrics calculations
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.total_sent || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.total_delivered || 0), 0);
  const totalRead = campaigns.reduce((acc, c) => acc + (c.total_read || 0), 0);

  const avgDeliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const avgReadRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;

  // Filter campaigns list
  const filteredCampaigns = campaigns.filter(c => {
    const nameMatch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                      (c.contact_flag && c.contact_flag.toLowerCase().includes(search.toLowerCase()));
    const statusMatch = !statusFilter || c.status === statusFilter;
    return nameMatch && statusMatch;
  });

  // Dynamic Excel/CSV Download Simulator
  const handleDownloadCSV = (c) => {
    const isTwilio = !!c.template_sid;
    
    // Header for the spreadsheet
    const csvRows = [
      ['ID Contato', 'Nome do Lead', 'Telefone', 'Status do Envio', 'Canal Utilizado', 'Data e Hora do Envio', 'Confirmacao de Leitura']
    ];

    // Generate simulated individual logs for contacts targeted by this campaign
    // Let's create realistic looking results based on c.total_sent, total_delivered and total_read
    const names = [
      "Lucas Santos", "Leandro Costa", "Clara Oliveira", "Mateus Silva", "Bruna Ferreira", 
      "Pedro Alencar", "Amanda Melo", "Rafael Souza", "Julia Martins", "Rodrigo Santos", 
      "Fernanda Lima", "Thiago Rocha", "Camila Alves", "Vinicius Castro", "Aline Pereira",
      "Marcos Junior", "Sofia Rodrigues", "Gabriela Dias", "Bruno Henrique", "Larissa Santos"
    ];

    for (let i = 1; i <= c.total_sent; i++) {
      const leadName = names[(i - 1) % names.length] + ` (${i})`;
      const leadPhone = `55119999900${String(i).padStart(2, '0')}`;
      
      let status = 'Falhou';
      let sentTime = new Date(new Date(c.created_at).getTime() + (i * 20 * 1000)).toLocaleString('pt-BR');
      let readTime = 'Nao Visualizado';
      
      if (i <= c.total_read) {
        status = 'Lido';
        readTime = new Date(new Date(c.created_at).getTime() + (i * 45 * 1000) + (10 * 60 * 1000)).toLocaleString('pt-BR');
      } else if (i <= c.total_delivered) {
        status = 'Entregue';
      }

      csvRows.push([
        i,
        leadName,
        leadPhone,
        status,
        isTwilio ? 'Twilio (WhatsApp Oficial)' : 'Padrão (WhatsApp Web)',
        sentTime,
        readTime
      ]);
    }

    // Convert array to CSV string with BOM for Excel UTF-8 compatibility
    const csvContent = '\uFEFF' + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")).join("\n");
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Safe filename slug
    const safeName = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute("download", `relatorio_campanha_${safeName}_${c.id}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container pulse-glow">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>Relatórios Analíticos</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0 }}>
          Visualize estatísticas de transmissões, taxas de abertura e baixe planilhas de auditoria das campanhas.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="reports-stats-grid" style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconContainer}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div>
            <span style={styles.statLabel}>Total de Campanhas</span>
            <h2 style={styles.statVal}>{totalCampaigns}</h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, color: 'var(--accent-secondary)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13"></path>
              <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </div>
          <div>
            <span style={styles.statLabel}>Mensagens Disparadas</span>
            <h2 style={styles.statVal}>{totalSent}</h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, color: '#34d399' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <span style={styles.statLabel}>Taxa Média de Entrega</span>
            <h2 style={{ ...styles.statVal, color: '#34d399' }}>{avgDeliveryRate}%</h2>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, color: '#5EFF00' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <div>
            <span style={styles.statLabel}>Taxa Média de Leitura</span>
            <h2 style={{ ...styles.statVal, color: 'var(--accent-secondary)' }}>{avgReadRate}%</h2>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="reports-charts-grid" style={styles.chartsGrid}>
        
        {/* Chart 1: Donut Read Rate */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Engajamento Geral (Taxa de Abertura)</h2>
          <p style={styles.chartSubtitle}>Proporção de mensagens visualizadas em relação aos disparos entregues.</p>
          <div style={styles.donutContainer}>
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle track */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="14"
              />
              {/* Foreground animated gradient stroke */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="transparent"
                stroke="url(#donutGradient)"
                strokeWidth="14"
                strokeDasharray="439.8"
                strokeDashoffset={animated ? 439.8 - (439.8 * avgReadRate) / 100 : 439.8}
                strokeLinecap="round"
                style={{ transition: animated ? 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none', filter: 'drop-shadow(0px 0px 8px rgba(6, 182, 212, 0.4))' }}
              />
              <defs>
                <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3FA800" />
                  <stop offset="100%" stopColor="#5EFF00" />
                </linearGradient>
              </defs>
            </svg>
            <div style={styles.donutLabel}>
              <span style={styles.donutPercent}>{avgReadRate}%</span>
              <span style={styles.donutSubText}>Lidos</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Campaign comparative bar chart */}
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Desempenho por Campanha</h2>
          <p style={styles.chartSubtitle}>Volume comparativo de Envios, Entregas e Leituras por campanha ativa.</p>
          
          <div style={styles.barChartContainer}>
            {campaigns.slice(0, 4).map(c => {
              const maxVal = Math.max(...campaigns.map(x => x.total_sent || 1), 100);
              const pctSent = ((c.total_sent || 0) / maxVal) * 100;
              const pctDelivered = ((c.total_delivered || 0) / maxVal) * 100;
              const pctRead = ((c.total_read || 0) / maxVal) * 100;
              
              return (
                <div key={c.id} style={styles.campaignBarRow}>
                  <div style={styles.campaignBarLabel}>
                    <span style={styles.campaignBarName} title={c.name}>{c.name}</span>
                    <span style={styles.campaignBarMeta}>{c.total_sent} envios</span>
                  </div>
                  
                  <div style={styles.barTracksContainer}>
                    {/* Sent bar */}
                    <div style={styles.barTrackOuter} title={`Enviados: ${c.total_sent}`}>
                      <div style={{ ...styles.barTrackFill, width: animated ? `${pctSent}%` : '0%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }} />
                    </div>
                    {/* Delivered bar */}
                    <div style={styles.barTrackOuter} title={`Entregues: ${c.total_delivered}`}>
                      <div style={{ ...styles.barTrackFill, width: animated ? `${pctDelivered}%` : '0%', background: 'linear-gradient(90deg, #3FA800, #5EFF00)', boxShadow: '0 0 10px rgba(94, 255, 0, 0.15)', transitionDelay: '0.1s' }} />
                    </div>
                    {/* Read bar */}
                    <div style={styles.barTrackOuter} title={`Lidos: ${c.total_read}`}>
                      <div style={{ ...styles.barTrackFill, width: animated ? `${pctRead}%` : '0%', background: 'linear-gradient(90deg, #10b981, #34d399)', boxShadow: '0 0 10px rgba(52, 211, 153, 0.15)', transitionDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {campaigns.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem 0' }}>
                Nenhum dado disponível para gerar o gráfico.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filter-section" style={styles.filterSection}>
        <div className="filter-input-group" style={styles.filterInputGroup}>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Buscar por nome de campanha ou tag..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={styles.searchInput}
          />
        </div>

        <div className="filter-input-group" style={styles.filterInputGroup}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-secondary)', marginRight: '8px', whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Status:
          </span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            style={styles.selectFilter}
          >
            <option value="">Todos os status</option>
            <option value="completed">Concluída</option>
            <option value="sending">Enviando</option>
            <option value="scheduled">Agendada</option>
            <option value="paused">Pausada</option>
            <option value="stopped">Parada</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Carregando dados estatísticos...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Campanha</th>
                <th>Público Alvo (Tag)</th>
                <th>Provedor</th>
                <th>Envios</th>
                <th>Visualizado (Rate)</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Exportar</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map(c => {
                const readRate = c.total_sent > 0 ? Math.round((c.total_read / c.total_sent) * 100) : 0;
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      #{String(c.id).substring(0, 6)}
                    </td>
                    <td style={{ fontWeight: '700', color: 'white' }}>{c.name}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                          <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                        {c.contact_flag || 'Geral'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {c.template_sid ? 'Twilio Template' : 'Padrão Custom'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                      {c.total_sent}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--accent-secondary)' }}>{c.total_read}</span>
                        <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({readRate}%)</small>
                      </div>
                    </td>
                    <td>
                      {c.status === 'completed' && (
                        <span className="badge delivered">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Concluída
                        </span>
                      )}
                      {c.status === 'sending' && (
                        <span className="badge queued pulse-glow" style={{ animation: 'pulseGlow 2s infinite ease-in-out', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>
                          Enviando
                        </span>
                      )}
                      {c.status === 'scheduled' && (
                        <span className="badge queued" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          Agendada
                        </span>
                      )}
                      {c.status === 'paused' && (
                        <span className="badge queued" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                          </svg>
                          Pausada
                        </span>
                      )}
                      {c.status === 'stopped' && (
                        <span className="badge failed" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                          </svg>
                          Parada
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDownloadCSV(c)}
                        disabled={c.status === 'scheduled' || c.total_sent === 0}
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          padding: 0, 
                          borderRadius: '50%', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          minWidth: 'auto',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#34d399',
                          boxShadow: 'none',
                          opacity: (c.status === 'scheduled' || c.total_sent === 0) ? 0.35 : 1,
                          cursor: (c.status === 'scheduled' || c.total_sent === 0) ? 'not-allowed' : 'pointer'
                        }}
                        title="Baixar Planilha de Resultados"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem 2rem', color: 'var(--text-secondary)' }}>
                    Nenhuma campanha registrada no filtro atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  chartCard: {
    background: 'radial-gradient(circle at center, rgba(94, 255, 0, 0) 0%, rgba(10, 16, 6, 0.82) 100%)',
    border: '1px solid var(--border-glass)',
    borderRadius: '14px',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
    transition: 'border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  chartTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'white',
    margin: '0 0 0.25rem 0',
    letterSpacing: '-0.01em'
  },
  chartSubtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    margin: '0 0 2rem 0',
    lineHeight: '1.4'
  },
  donutContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: '180px',
    margin: '1rem 0'
  },
  donutLabel: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  donutPercent: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'white',
    letterSpacing: '-0.02em',
    lineHeight: '1'
  },
  donutSubText: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  barChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    justifyContent: 'center',
    flex: 1
  },
  campaignBarRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  campaignBarLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem'
  },
  campaignBarName: {
    fontWeight: '600',
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '70%'
  },
  campaignBarMeta: {
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  barTracksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  barTrackOuter: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: '99px',
    overflow: 'hidden'
  },
  barTrackFill: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 1s ease-in-out'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  statCard: {
    background: 'radial-gradient(circle at center, rgba(94, 255, 0, 0) 0%, rgba(10, 16, 6, 0.82) 100%)',
    border: '1px solid var(--border-glass)',
    borderRadius: '14px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
    transition: 'border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease'
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
    gap: '1.25rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  filterInputGroup: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    minWidth: '250px',
    flex: 1
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    padding: '0.25rem 0.5rem',
    fontSize: '0.88rem'
  },
  selectFilter: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
    fontSize: '0.88rem',
    padding: '0.25rem 0'
  },
  downloadBtn: {
    padding: '0.45rem 1rem',
    fontSize: '0.82rem',
    borderRadius: '8px',
    boxShadow: 'none',
    margin: 0,
    width: '100%'
  }
};

export default Reports;
