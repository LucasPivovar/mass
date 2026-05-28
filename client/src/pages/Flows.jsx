import React from 'react';
import { useNavigate } from 'react-router-dom';

const PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok Automation',
    description: 'Automatize respostas de comentários, mensagens diretas e menções nos seus vídeos.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
    color: '#00F2FE',
    borderGlow: 'rgba(0, 242, 254, 0.15)',
    status: 'Ativo',
    nodesCount: 8,
    lastTriggered: 'Há 5 min'
  },
  {
    id: 'instagram',
    name: 'Instagram Funnel',
    description: 'Responda a Directs automaticamente por palavras-chave e reações aos Stories.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    color: '#E1306C',
    borderGlow: 'rgba(225, 48, 108, 0.15)',
    status: 'Ativo',
    nodesCount: 12,
    lastTriggered: 'Há 2 min'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Auto-Reply',
    description: 'Fluxo principal de atendimento ao cliente com inteligência artificial e transbordo.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
    color: '#25D366',
    borderGlow: 'rgba(37, 211, 102, 0.15)',
    status: 'Ativo',
    nodesCount: 15,
    lastTriggered: 'Ativo agora'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Pro B2B',
    description: 'Conecte-se com decisores de empresas, envie apresentações automáticas e qualifique leads corporativos.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    color: '#0077B5',
    borderGlow: 'rgba(0, 119, 181, 0.15)',
    status: 'Ativo',
    nodesCount: 11,
    lastTriggered: 'Há 12 min'
  },
  {
    id: 'sandbox',
    name: 'Sandbox',
    description: 'Área de testes livre. Crie, experimente e teste fluxos sem afetar seus canais ativos.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    color: '#f59e0b',
    borderGlow: 'rgba(245, 158, 11, 0.15)',
    status: 'Sandbox',
    nodesCount: 0,
    lastTriggered: 'Área de testes'
  }
];

export default function Flows({ token }) {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1>Canais de Automação</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Gerencie e configure seus canais de disparo e fluxos de atendimento automatizado.
          </p>
        </div>
        <button onClick={() => navigate('/flows/new')} style={{ borderRadius: '12px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Novo Canal
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.25rem',
        marginTop: '1rem'
      }}>
        {PLATFORMS.map((platform) => (
          <div
            key={platform.id}
            onClick={() => navigate(`/flows/${platform.id}`)}
            className="card-gradient"
            style={{
              padding: '2rem 1.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px',
              border: `1px solid rgba(255, 255, 255, 0.05)`,
              boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5)`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = platform.color;
              e.currentTarget.style.boxShadow = `0 0 25px ${platform.borderGlow}`;
              e.currentTarget.style.transform = 'translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Header section with Icon & Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{
                color: platform.color,
                background: `rgba(${parseInt(platform.color.slice(1,3), 16) || 0}, ${parseInt(platform.color.slice(3,5), 16) || 0}, ${parseInt(platform.color.slice(5,7), 16) || 0}, 0.1)`,
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {platform.icon}
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '99px',
                background: platform.status === 'Ativo' ? 'rgba(94, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                color: platform.status === 'Ativo' ? '#5EFF00' : 'var(--text-secondary)',
                border: `1px solid ${platform.status === 'Ativo' ? 'rgba(94, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`
              }}>
                {platform.status}
              </span>
            </div>

            {/* Content section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#ffffff' }}>
                {platform.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: '1.4' }}>
                {platform.description}
              </p>
            </div>

            {/* Footer metadata */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '1rem',
              fontSize: '0.8rem',
              color: 'var(--text-tertiary)'
            }}>
              <span>{platform.nodesCount} blocos de decisão</span>
              <span>{platform.lastTriggered}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
