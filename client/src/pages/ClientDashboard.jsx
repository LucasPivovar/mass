import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Brand tokens ─────────────────────────────────────────────────── */
const B = {
  lime:      '#5EFF00',
  limeAlpha: 'rgba(94,255,0,', 
  green:     '#3FA800',
  text:      '#E5E5E5',
  muted:     '#9CA3AF',
  subtle:    '#6B7280',
  card:      'rgba(10,16,6,0.7)',
  border:    'rgba(94,255,0,0.09)',
  borderHov: 'rgba(94,255,0,0.24)',
};

/* ─── Mock Data ─────────────────────────────────────────────────────── */
const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Lançamento Produto A', client: 'João Silva', sent: 1500, read: 1200, failed: 12, ctr: '80%' },
  { id: 2, name: 'Oferta Black Friday', client: 'Maria Oliveira', sent: 5000, read: 4200, failed: 45, ctr: '84%' },
  { id: 3, name: 'Aviso de Manutenção', client: 'Empresa X', sent: 300, read: 290, failed: 2, ctr: '96%' }
];

const MOCK_RECIPIENTS = {
  1: [
    { name: 'Alice Santos', phone: '(11) 98765-4321', status: 'Lido', time: '10:14', message: 'Olá Alice, seu pedido A-102 já foi despachado! Acompanhe pelo link...' },
    { name: 'Bruno Lima', phone: '(21) 97654-3210', status: 'Lido', time: '10:12', message: 'Olá Bruno, seu pedido A-103 já foi despachado! Acompanhe pelo link...' },
    { name: 'Carla Souza', phone: '(31) 96543-2109', status: 'Lido', time: '10:05', message: 'Olá Carla, seu pedido A-104 já foi despachado! Acompanhe pelo link...' },
    { name: 'Daniel Alves', phone: '(41) 95432-1098', status: 'Falha', time: '10:01', message: 'Olá Daniel, seu pedido A-105 já foi despachado! Acompanhe pelo link...' },
    { name: 'Eduarda Rocha', phone: '(51) 94321-0987', status: 'Enviado', time: '09:58', message: 'Olá Eduarda, seu pedido A-106 já foi despachado! Acompanhe pelo link...' },
    { name: 'Fabio Junior', phone: '(11) 93210-9876', status: 'Lido', time: '09:55', message: 'Olá Fabio, seu pedido A-107 já foi despachado! Acompanhe pelo link...' },
    { name: 'Gisele Bündchen', phone: '(21) 92109-8765', status: 'Lido', time: '09:50', message: 'Olá Gisele, seu pedido A-108 já foi despachado! Acompanhe pelo link...' },
    { name: 'Heitor Neto', phone: '(31) 91098-7654', status: 'Enviado', time: '09:44', message: 'Olá Heitor, seu pedido A-109 já foi despachado! Acompanhe pelo link...' },
    { name: 'Iara Lima', phone: '(11) 90987-6543', status: 'Lido', time: '09:40', message: 'Olá Iara, seu pedido A-110 já foi despachado! Acompanhe pelo link...' },
    { name: 'Jonas Silva', phone: '(41) 98765-1111', status: 'Falha', time: '09:35', message: 'Olá Jonas, seu pedido A-111 já foi despachado! Acompanhe pelo link...' }
  ],
  2: [
    { name: 'Felipe Costa', phone: '(11) 91234-5678', status: 'Lido', time: '12:45', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'Gabriela Dias', phone: '(21) 92345-6789', status: 'Lido', time: '12:42', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'Henrique Melo', phone: '(31) 93456-7890', status: 'Falha', time: '12:30', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'Isabela Cruz', phone: '(41) 94567-8901', status: 'Lido', time: '12:28', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'João Pires', phone: '(51) 95678-9012', status: 'Lido', time: '12:15', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'Karina Ramos', phone: '(11) 96789-0123', status: 'Enviado', time: '12:10', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'Leandro Borges', phone: '(21) 97890-1234', status: 'Lido', time: '12:05', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'Michele Antunes', phone: '(31) 98901-2345', status: 'Lido', time: '11:58', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' },
    { name: 'Nivaldo Reis', phone: '(41) 99012-3456', status: 'Falha', time: '11:50', message: 'Aproveite a Black Friday! Use o cupom BLACK10 para ganhar desc...' }
  ],
  3: [
    { name: 'Lucas Vieira', phone: '(11) 99887-7665', status: 'Lido', time: '08:22', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' },
    { name: 'Mariana Silva', phone: '(21) 98877-6655', status: 'Lido', time: '08:18', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' },
    { name: 'Nathalia Gomes', phone: '(31) 97766-5544', status: 'Lido', time: '08:15', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' },
    { name: 'Otavio Neto', phone: '(41) 96655-4433', status: 'Enviado', time: '08:10', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' },
    { name: 'Patricia Lins', phone: '(51) 95544-3322', status: 'Lido', time: '08:02', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' },
    { name: 'Roberto Carlos', phone: '(11) 94433-2211', status: 'Lido', time: '07:55', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' },
    { name: 'Silvia Leticia', phone: '(21) 93322-1100', status: 'Enviado', time: '07:50', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' },
    { name: 'Tiago Souza', phone: '(31) 92211-0099', status: 'Lido', time: '07:45', message: 'Prezado cliente, informamos que nosso sistema passará por manu...' }
  ]
};

const LINE_DATA = [
  { label:'08:00', value: 120, x:14  },
  { label:'10:00', value: 380, x:97  },
  { label:'12:00', value: 890, x:180 },
  { label:'14:00', value: 650, x:263 },
  { label:'16:00', value: 410, x:330 },
  { label:'18:00', value: 920, x:410 },
  { label:'20:00', value: 540, x:486 },
];

function svgY(val, mn, mx, h = 120) {
  return h - ((val - mn) / (mx - mn)) * h;
}

/* ─── Shared Card ──────────────────────────────────────────────────── */
const Card = ({ children, style, hoverable, className }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      className={className || "card-gradient"}
      onMouseEnter={hoverable ? () => setHov(true)  : undefined}
      onMouseLeave={hoverable ? () => setHov(false) : undefined}
      style={{
        borderRadius: '14px',
        transition: 'border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease',
        transform: hoverable && hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(94,255,0,0.06)' : 'var(--shadow-sm)',
        borderColor: hov ? B.borderHov : B.border,
        willChange: 'transform',
        ...style,
      }}>
      {children}
    </div>
  );
};

/* ─── Line Chart ───────────────────────────────────────────────────── */
const LineChart = ({ campaign }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [hov, setHov] = useState(null);

  // Dynamically calculate 15 hourly chart points based on selected campaign sent count to auto-update
  const factor = campaign ? (campaign.sent / 1500) : 1;
  const baseValues = [120, 240, 380, 520, 890, 780, 650, 530, 410, 680, 920, 790, 540, 320, 180];
  const labels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  
  const dynamicData = labels.map((label, idx) => {
    const val = baseValues[idx];
    const value = Math.round(val * factor);
    // Span exactly from 6px to 494px to maximize width while protecting point circle radius boundaries
    const x = 6 + idx * (488 / (labels.length - 1));
    return { label, value, x };
  });

  const vals = dynamicData.map(d => d.value);
  const mn   = Math.min(...vals) * 0.82;
  const mx   = Math.max(...vals) * 1.08;
  const pts  = dynamicData.map(d => ({ ...d, y: svgY(d.value, mn, mx) }));
  const line = pts.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${pts[pts.length-1].x} 120 L ${pts[0].x} 120 Z`;

  return (
    <div style={{ position:'relative', width:'100%', maxWidth:'100%', overflow:'hidden', boxSizing:'border-box' }}>
      <svg key={campaign ? `${campaign.id}-${mounted}` : (mounted ? 'mounted' : 'initial')} viewBox="0 0 500 148" width="100%" style={{ overflow:'visible', display:'block', maxHeight: '350px' }}>
        <defs>
          <linearGradient id="client-lc-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={B.lime}  />
            <stop offset="100%" stopColor={B.green} />
          </linearGradient>
          <linearGradient id="client-lc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={B.lime} stopOpacity="0.18" />
            <stop offset="100%" stopColor={B.lime} stopOpacity="0" />
          </linearGradient>
          <clipPath id="client-chart-reveal">
            <rect x="0" y="0" width="500" height="150">
              <animate attributeName="width" from="0" to="500" dur="3.0s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" keyTimes="0;1" />
            </rect>
          </clipPath>
        </defs>
        
        {/* Background grids */}
        {[20,50,80,110].map(y => (
          <line key={y} x1="0" y1={y} x2="500" y2={y}
            stroke="rgba(94,255,0,0.05)" strokeWidth="1" strokeDasharray="4 6" />
        ))}
        <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(94,255,0,0.08)" strokeWidth="1" />
        
        {/* Animated chart content */}
        <g clipPath="url(#client-chart-reveal)">
          <path d={area} fill="url(#client-lc-area)" />
          <path d={line} fill="none" stroke="url(#client-lc-stroke)" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" 
          />
        </g>
 
        {pts.map((p, i) => (
          <g key={i}>
            {hov === i && (
              <line x1={p.x} y1="5" x2={p.x} y2="120"
                stroke="rgba(94,255,0,0.15)" strokeWidth="1.5" strokeDasharray="3 4" />
            )}
            {hov === i && (
              <circle cx={p.x} cy={p.y} r="12"
                fill="rgba(94,255,0,0.07)" stroke="rgba(94,255,0,0.18)" strokeWidth="1" />
            )}
            <circle cx={p.x} cy={p.y}
              r={hov === i ? 5.5 : 4}
              fill={hov === i ? B.green : B.lime}
              stroke="#000" strokeWidth="2"
              style={{ transition:'r 0.18s ease, fill 0.18s ease' }}
            />
            <text x={p.x} y="144"
              fill={hov === i ? 'rgba(229,229,229,0.9)' : 'rgba(107,114,128,0.65)'}
              fontSize="9" fontWeight="600" textAnchor="middle"
              style={{ transition:'fill 0.15s', fontFamily:'Outfit,sans-serif' }}>
              {p.label}
            </text>
            <rect x={p.x - 16.5} y="0" width="33" height="148"
              fill="transparent" style={{ cursor:'crosshair' }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {pts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          pointerEvents: 'none',
          opacity: hov === i ? 1 : 0,
          transform: `translateX(-50%) translateY(${hov===i?0:6}px)`,
          transition: 'opacity 0.18s ease, transform 0.18s ease',
          top: `calc(${(p.y / 148) * 100}% - 45px)`,
          left: p.x > 380 ? 'auto' : `${(p.x / 500) * 100}%`,
          right: p.x > 380 ? 0 : 'auto',
          background: 'rgba(5,9,3,0.97)',
          border: `1px solid rgba(94,255,0,0.22)`,
          borderRadius: '10px',
          padding: '9px 13px',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6), 0 0 12px rgba(94,255,0,0.1)',
          zIndex: 40,
          minWidth: '110px',
        }}>
          <p style={{ fontSize:'0.68rem', color:B.subtle, fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 3px 0' }}>{p.label}</p>
          <p style={{ fontSize:'1.2rem', fontWeight:'800', color:B.text, letterSpacing:'-0.02em', margin:'0 0 2px 0', lineHeight:1 }}>{p.value.toLocaleString()}</p>
          <p style={{ fontSize:'0.68rem', color:B.lime, fontWeight:'600', margin:0 }}>interações</p>
        </div>
      ))}
    </div>
  );
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [selectedCampaignId, setSelectedCampaignId] = useState(MOCK_CAMPAIGNS[0].id);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const handleReload = () => {
      setReloadKey(prev => prev + 1);
    };
    window.addEventListener('reload-client-chart', handleReload);
    return () => window.removeEventListener('reload-client-chart', handleReload);
  }, []);

  const campaign = MOCK_CAMPAIGNS.find(c => c.id === Number(selectedCampaignId)) || MOCK_CAMPAIGNS[0];

  const handleExportCSV = () => {
    const list = MOCK_RECIPIENTS[campaign.id] || [];
    // CSV headers using BOM for Excel compatibility in UTF-8
    const headers = ['Nome', 'Telefone', 'Status', 'Horario', 'Mensagem'];
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...list.map(row => [
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.phone}"`,
        `"${row.status}"`,
        `"${row.time}"`,
        `"${row.message.replace(/"/g, '""')}"`
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_campanha_${campaign.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container pulse-glow" style={{ padding: '2rem', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => setReloadKey(prev => prev + 1)}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#fff', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Dashboard do Cliente
          </h1>
          <p style={{ color: B.subtle, margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>
            Visualize os resultados individuais de cada campanha enviada.
          </p>
        </div>
        
        {/* Campaign Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(10, 16, 6, 0.6)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
          </svg>
          <select 
            value={selectedCampaignId} 
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              outline: 'none', 
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              minWidth: '220px',
              padding: '4px'
            }}
          >
            {MOCK_CAMPAIGNS.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#0b0f19' }}>
                {c.name} ({c.client})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* KPI 1: Mensagens Enviadas */}
        <Card hoverable style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(63,168,0,0.08)', color: B.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: B.subtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mensagens Enviadas
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '800', color: '#fff' }}>{campaign.sent}</h2>
            <span style={{ fontSize: '0.8rem', color: B.lime, fontWeight: '700', padding: '2px 8px', background: 'rgba(94,255,0,0.1)', borderRadius: '20px' }}>
              Concluído
            </span>
          </div>
        </Card>

        {/* KPI 2: Taxa Média de Entrega */}
        <Card hoverable style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(94,255,0,0.08)', color: B.lime, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: B.subtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Taxa Média de Entrega
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '800', color: '#fff' }}>{campaign.ctr}</h2>
            <span style={{ fontSize: '0.8rem', color: B.lime, fontWeight: '700', padding: '2px 8px', background: 'rgba(94,255,0,0.1)', borderRadius: '20px' }}>
              {campaign.read} Lidas
            </span>
          </div>
        </Card>

        {/* KPI 3: Erros no Envio */}
        <Card hoverable style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: B.subtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Erros no Envio
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '800', color: '#fff' }}>{campaign.failed}</h2>
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '700' }}>
              Falhas
            </span>
          </div>
        </Card>

      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Advanced Chart Visualization (Full Width) */}
        <Card className="card-gradient" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', padding: '2rem 0 0 0' }}>
          <h3 style={{ margin: '0 2rem 1.5rem 2rem', fontSize: '1.1rem', color: '#fff' }}>Evolução de Interações</h3>
          <LineChart campaign={campaign} key={`${campaign.id}-${reloadKey}`} />
        </Card>

        {/* Spacious Recipients Log Table (Full Width) */}
        <Card className="card-gradient" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.lime} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Relatório Completo de Envios ({campaign.client})
            </h3>
            
            {/* Export CSV Button */}
            <button 
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(94, 255, 0, 0.08)',
                border: '1px solid rgba(94, 255, 0, 0.22)',
                color: B.lime,
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(94, 255, 0, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(94, 255, 0, 0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(94, 255, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(94, 255, 0, 0.22)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exportar CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: B.subtle, textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px', fontWeight: '600' }}>Destinatário</th>
                  <th style={{ padding: '12px 10px', fontWeight: '600' }}>Telefone</th>
                  <th style={{ padding: '12px 10px', fontWeight: '600' }}>Mensagem Enviada</th>
                  <th style={{ padding: '12px 10px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 10px', fontWeight: '600', textAlign: 'right' }}>Horário</th>
                </tr>
              </thead>
              <tbody>
                {(MOCK_RECIPIENTS[campaign.id] || []).map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: B.text }}>
                    <td style={{ padding: '14px 10px', fontWeight: '600', color: '#fff' }}>{r.name}</td>
                    <td style={{ padding: '14px 10px', color: B.subtle }}>{r.phone}</td>
                    <td style={{ padding: '14px 10px', color: 'rgba(229, 229, 229, 0.7)', fontSize: '0.82rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.message}>
                      {r.message}
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: r.status === 'Lido' ? 'rgba(94, 255, 0, 0.08)' : r.status === 'Enviado' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        color: r.status === 'Lido' ? B.lime : r.status === 'Enviado' ? '#f59e0b' : '#ef4444',
                        border: `1px solid ${r.status === 'Lido' ? 'rgba(94, 255, 0, 0.2)' : r.status === 'Enviado' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'right', color: B.subtle, fontWeight: '500' }}>{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default ClientDashboard;
