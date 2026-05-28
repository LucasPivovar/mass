import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ─── Brand tokens ─────────────────────────────────────────────────── */
const B = {
  lime:      '#5EFF00',
  limeAlpha: 'rgba(94,255,0,',   // append opacity + ')'
  green:     '#3FA800',
  text:      '#E5E5E5',
  muted:     '#9CA3AF',
  subtle:    '#6B7280',
  card:      'rgba(10,16,6,0.7)',
  border:    'rgba(94,255,0,0.09)',
  borderHov: 'rgba(94,255,0,0.24)',
};

// Helper to render Icons dynamically based on color
const getIcon = (type, c) => {
  if (type === 'contacts') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  if (type === 'sent') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
  );
  if (type === 'read') return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
};

/* ─── Chart data ───────────────────────────────────────────────────── */
const LINE_DATA = [
  { label:'Seg', value:320, x:14  },
  { label:'Ter', value:480, x:97  },
  { label:'Qua', value:390, x:180 },
  { label:'Qui', value:760, x:263 },
  { label:'Sex', value:610, x:330 },
  { label:'Sáb', value:290, x:410 },
  { label:'Dom', value:510, x:486 },
];
const BAR_DATA = [
  { label:'Camp A', entregue:96, lido:74 },
  { label:'Camp B', entregue:82, lido:58 },
  { label:'Camp C', entregue:99, lido:88 },
  { label:'Camp D', entregue:71, lido:49 },
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

/* ─── Section Label ────────────────────────────────────────────────── */
const SLabel = ({ children }) => (
  <p style={{ fontSize:'0.67rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(107,114,128,0.75)', margin:'0 0 0.9rem 0' }}>
    {children}
  </p>
);

/* ─── Line Chart ───────────────────────────────────────────────────── */
const LineChart = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [hov, setHov] = useState(null);
  const vals = LINE_DATA.map(d => d.value);
  const mn   = Math.min(...vals) * 0.82;
  const mx   = Math.max(...vals) * 1.08;
  const pts  = LINE_DATA.map(d => ({ ...d, y: svgY(d.value, mn, mx) }));
  const line = pts.map((p, i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${pts[pts.length-1].x} 120 L ${pts[0].x} 120 Z`;

  return (
    <div style={{ position:'relative', width:'100%' }}>
      <svg key={mounted ? 'mounted' : 'initial'} viewBox="0 0 500 148" width="100%" height="170" style={{ overflow:'visible', display:'block' }}>
        <defs>
          <linearGradient id="lc-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={B.lime}  />
            <stop offset="100%" stopColor={B.green} />
          </linearGradient>
          <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={B.lime} stopOpacity="0.18" />
            <stop offset="100%" stopColor={B.lime} stopOpacity="0" />
          </linearGradient>
          <clipPath id="chart-reveal">
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
        <g clipPath="url(#chart-reveal)">
          <path d={area} fill="url(#lc-area)" />
          <path d={line} fill="none" stroke="url(#lc-stroke)" strokeWidth="2.2"
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
              fontSize="11" fontWeight="600" textAnchor="middle"
              style={{ transition:'fill 0.15s', fontFamily:'Outfit,sans-serif' }}>
              {p.label}
            </text>
            <rect x={p.x-34} y="0" width="68" height="148"
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
          top: Math.max(0, (p.y / 148) * 170 - 68),
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
          <p style={{ fontSize:'0.68rem', color:B.lime, fontWeight:'600', margin:0 }}>disparos</p>
        </div>
      ))}
    </div>
  );
};

/* ─── Campaign Bars ────────────────────────────────────────────────── */
const CampaignBars = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px', borderRadius:'10px', overflow:'hidden', background:'transparent', marginTop:'1rem' }}>
      {BAR_DATA.map((d, i) => (
        <div key={i}
          style={{ padding:'1rem 1.1rem', background: 'transparent' }}>
          <p style={{ fontSize:'0.7rem', fontWeight:'700', color: B.subtle, textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.75rem 0' }}>
            {d.label}
          </p>
          {/* Entregue */}
          <div style={{ marginBottom:'0.6rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
              <span style={{ fontSize:'0.7rem', color:B.subtle, fontWeight:'500' }}>Entregue</span>
              <span style={{ fontSize:'0.78rem', fontWeight:'800', color:B.lime }}>{d.entregue}%</span>
            </div>
            <div style={{ height:'4px', borderRadius:'99px', background:'rgba(255,255,255,0.04)', overflow:'hidden' }}>
              <div style={{ height:'100%', width: mounted ? `${d.entregue}%` : '0%', borderRadius:'99px', background:`linear-gradient(90deg,${B.lime},${B.green})`, transition:`width ${1.5+i*0.3}s cubic-bezier(0.34,1.56,0.64,1)` }} />
            </div>
          </div>
          {/* Lido */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
              <span style={{ fontSize:'0.7rem', color:B.subtle, fontWeight:'500' }}>Lido</span>
              <span style={{ fontSize:'0.78rem', fontWeight:'800', color:B.green }}>{d.lido}%</span>
            </div>
            <div style={{ height:'4px', borderRadius:'99px', background:'rgba(255,255,255,0.04)', overflow:'hidden' }}>
              <div style={{ height:'100%', width: mounted ? `${d.lido}%` : '0%', borderRadius:'99px', background:`linear-gradient(90deg,${B.green},rgba(63,168,0,0.6))`, transition:`width ${1.8+i*0.3}s cubic-bezier(0.34,1.56,0.64,1)` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Dashboard Page ───────────────────────────────────────────────── */
const Dashboard = ({ token }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeContacts: 0, totalSent: 0, readRate: '0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [contactsRes, campaignsRes] = await Promise.all([
          axios.get('/api/contacts', { headers }),
          axios.get('/api/campaigns', { headers })
        ]);

        // Se a resposta for um objeto paginado, extrai a lista de contatos do atributo 'contacts'
        const rawContacts = contactsRes.data;
        const contacts = Array.isArray(rawContacts) 
          ? rawContacts 
          : (rawContacts?.contacts || []);

        const rawCampaigns = campaignsRes.data;
        const campaigns = Array.isArray(rawCampaigns) 
          ? rawCampaigns 
          : (rawCampaigns?.campaigns || []);

        const activeContacts = contacts.length;
        let totalSent = 0;
        let totalRead = 0;

        campaigns.forEach(c => {
          totalSent += (c.total_sent || 0);
          totalRead += (c.total_read || 0);
        });

        const readRate = totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : '0';

        setStats({ activeContacts, totalSent, readRate });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const kpis = [
    {
      label: 'Contatos Ativos', value: (stats.activeContacts || 0).toLocaleString(), badge: 'Total', detail: 'cadastrados',
      badgeOk: true, bg: 'rgba(94,255,0,0.08)', iconColor: B.lime, iconType: 'contacts'
    },
    {
      label: 'Disparos Realizados', value: (stats.totalSent || 0).toLocaleString(), badge: 'Envios', detail: 'totais',
      badgeOk: true, bg: 'rgba(63,168,0,0.08)', iconColor: B.green, iconType: 'sent'
    },
    {
      label: 'Taxa de Leitura', value: `${stats.readRate || 0}%`, badge: 'Média', detail: 'engajamento',
      badgeOk: true, bg: 'rgba(94,255,0,0.05)', iconColor: B.lime, iconType: 'read'
    }
  ];

  return (
    <div className="page-container" style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>

      {/* Header */}
      <div>
        <h1 style={{ marginBottom:'0.3rem' }}>Visão Geral</h1>
        <p style={{ color:B.subtle, fontSize:'0.85rem', margin:0, fontWeight:'400', lineHeight:1.6 }}>
          Painel de controle · Disparos inteligentes
        </p>
      </div>

      {/* KPI */}
      <div>
        <SLabel>Visão Geral</SLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(175px, 1fr))', gap:'0.875rem' }}>
          {kpis.map((k, i) => (
            <Card key={i} hoverable style={{ padding:'1.6rem 1.25rem 1.3rem', display:'flex', flexDirection:'column', gap:'0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize:'0.7rem', fontWeight:'700', color:B.subtle, textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 0.3rem 0' }}>{k.label}</p>
                  <p style={{ fontSize:'2rem', fontWeight:'800', color:'#ffffff', letterSpacing:'-0.03em', margin:0, lineHeight:1 }}>{k.value}</p>
                </div>
                <div style={{ width:'48px', height:'48px', borderRadius:'13px', background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid rgba(94,255,0,0.1)` }}>
                  {getIcon(k.iconType, k.iconColor)}
                </div>
              </div>
              <p style={{ fontSize:'0.74rem', color:'#ffffff', margin:0, fontWeight:'500' }}>
                <span style={{ color: '#ffffff', fontWeight:'500' }}>{k.badge}</span>{' '}{k.detail}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <SLabel>Análise de Desempenho</SLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:'0.875rem' }}>
          <Card style={{ padding:'1.5rem' }}>
            <p style={{ fontSize:'0.875rem', fontWeight:'700', color:B.text, margin:'0 0 0.15rem 0' }}>Volume de Disparos</p>
            <p style={{ fontSize:'0.73rem', color:B.subtle, margin:'0 0 1.25rem 0', fontWeight:'500' }}>Últimos 7 dias</p>
            <LineChart />
          </Card>
          <Card style={{ padding:'1.5rem' }}>
            <p style={{ fontSize:'0.875rem', fontWeight:'700', color:B.text, margin:'0 0 0.15rem 0' }}>Eficiência por Campanha</p>
            <p style={{ fontSize:'0.73rem', color:B.subtle, margin:0, fontWeight:'500' }}>Entrega e leitura por campanha</p>
            <CampaignBars />
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div>
        <SLabel>Ações Rápidas</SLabel>
        <div className="dashboard-cards-container" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap:'0.875rem' }}>

          {/* Contacts */}
          <Card hoverable style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.9rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'11px', background:'rgba(94,255,0,0.08)', border:'1px solid rgba(94,255,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={B.lime} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:B.lime, margin:'0 0 0.15rem 0' }}>Recomendado</p>
                <h2 style={{ fontSize:'0.95rem', fontWeight:'700', color:B.text, margin:0 }}>Importar contatos</h2>
              </div>
            </div>
            <p style={{ fontSize:'0.82rem', color:B.muted, lineHeight:1.65, margin:0 }}>
              Carregue sua lista de leads via Excel ou CSV para iniciar seus fluxos de disparo.
            </p>
            <button onClick={() => navigate('/contacts')} className="secondary" style={{ padding:'0.6rem 1.5rem', fontSize:'0.82rem', fontWeight:'600', borderRadius:'8px', width:'fit-content', display:'inline-flex', alignItems:'center', justifyContent: 'center', gap:'6px', marginTop:'auto' }}>
              Gerenciar Contatos
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </Card>

          {/* New Campaign */}
          <Card hoverable style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.9rem', borderColor:'rgba(94,255,0,0.14)', background:'rgba(8,16,4,0.8)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'11px', background:'linear-gradient(135deg,#5EFF00,#3FA800)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 16px rgba(94,255,0,0.3)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:B.green, margin:'0 0 0.15rem 0' }}>Novo Disparo</p>
                <h2 style={{ fontSize:'0.95rem', fontWeight:'700', color:B.text, margin:0 }}>Criar campanha</h2>
              </div>
            </div>
            <p style={{ fontSize:'0.82rem', color:B.muted, lineHeight:1.65, margin:0 }}>
              Monte um novo fluxo de mensagens com variáveis, mídias e segmentação de leads.
            </p>
            <button onClick={() => navigate('/new-campaign')} style={{ width:'fit-content', padding:'0.6rem 1.5rem', fontSize:'0.82rem', fontWeight:'600', borderRadius:'8px', marginTop:'auto', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              Criar Campanha
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 16 14"/></svg>
            </button>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
