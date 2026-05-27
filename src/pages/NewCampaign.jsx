import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const NewCampaign = ({ token }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  
  // Selection State
  const [campaignName, setCampaignName] = useState('');
  const [assignedUser, setAssignedUser] = useState('');
  const [provider, setProvider] = useState('zapi'); // 'zapi' or 'twilio'
  
  // Twilio Accounts & Templates State
  const [twilioAccounts, setTwilioAccounts] = useState([]);
  const [selectedTwilioAccount, setSelectedTwilioAccount] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateVars, setTemplateVars] = useState({});
  const [templateMediaUrl, setTemplateMediaUrl] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Z-API State
  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  
  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Paginated contacts & bulk selection states
  const [contactsPage, setContactsPage] = useState(1);
  const [totalContactsPages, setTotalContactsPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [tags, setTags] = useState([]);
  const [selectionType, setSelectionType] = useState('manual'); // 'manual' | 'tag' | 'all'

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch unique tags/flags
        const tagsResponse = await axios.get(`${API_BASE}/api/contacts/tags`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTags(tagsResponse.data || []);

        // Fetch settings to get default provider
        const settingsResponse = await axios.get(`${API_BASE}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (settingsResponse.data) {
          const defaultProv = settingsResponse.data.messaging_provider || 'zapi';
          setProvider(defaultProv);
        }

        // Fetch Twilio Accounts
        const twilioAccountsResponse = await axios.get(`${API_BASE}/api/twilio-accounts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTwilioAccounts(twilioAccountsResponse.data);
        if (twilioAccountsResponse.data.length > 0) {
          setSelectedTwilioAccount(twilioAccountsResponse.data[0]);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, [token]);

  // Load contacts page dynamically
  const fetchContactsPage = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/contacts`, {
        params: {
          page: contactsPage,
          limit: 10,
          flag: selectedTag || undefined
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.contacts) {
        setContacts(response.data.contacts);
        setTotalContacts(response.data.total);
        setTotalContactsPages(response.data.totalPages);
      } else {
        setContacts(response.data || []);
        setTotalContacts(response.data ? response.data.length : 0);
        setTotalContactsPages(response.data ? Math.max(Math.ceil(response.data.length / 10), 1) : 1);
      }
    } catch (err) {
      console.error('Error fetching contacts page:', err);
    }
  };

  useEffect(() => {
    setContactsPage(1);
  }, [selectedTag]);

  useEffect(() => {
    if (token) {
      fetchContactsPage();
    }
  }, [token, contactsPage, selectedTag]);

  // Load templates when selected Twilio account changes
  const fetchTemplatesForAccount = async (accountId) => {
    if (!accountId) {
      setTemplates([]);
      return;
    }
    setLoadingTemplates(true);
    try {
      const tmplResponse = await axios.get(`${API_BASE}/api/twilio/templates?twilioAccountId=${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(tmplResponse.data);
    } catch (err) {
      console.error('Error loading templates for Twilio account:', err);
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (provider === 'twilio' && selectedTwilioAccount) {
      fetchTemplatesForAccount(selectedTwilioAccount.id);
    } else {
      setTemplates([]);
    }
  }, [provider, selectedTwilioAccount, token]);

  const handleSelectContact = (id) => {
    if (selectionType !== 'manual') return; // Read-only checkbox in bulk select modes
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllContacts = () => {
    if (selectionType === 'all' || selectionType === 'tag') {
      setSelectionType('manual');
      setSelectedContacts([]);
    } else {
      if (selectedTag) {
        setSelectionType('tag');
      } else {
        setSelectionType('all');
      }
      setSelectedContacts([]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreviewUrl(URL.createObjectURL(file));
    } else {
      setMediaFile(null);
      setMediaPreviewUrl(null);
    }
  };

  const getTemplateBody = (tmpl) => {
    if (!tmpl || !tmpl.types) return '';
    const textType = tmpl.types['twilio/text'] || tmpl.types['twilio/media'] || tmpl.types['twilio/card'] || Object.values(tmpl.types)[0];
    return textType?.body || textType?.text || '';
  };

  const handleTemplateChange = (sid) => {
    const tmpl = templates.find(t => t.sid === sid);
    setSelectedTemplate(tmpl);
    setTemplateMediaUrl('');
    
    if (tmpl) {
      const body = getTemplateBody(tmpl);
      const regex = /\{\{(\d+)\}\}/g;
      let match;
      const vars = {};
      while ((match = regex.exec(body)) !== null) {
        const varNum = match[1];
        vars[varNum] = ''; 
      }
      setTemplateVars(vars);
    } else {
      setTemplateVars({});
    }
  };

  const handleVariableChange = (varNum, val) => {
    setTemplateVars(prev => ({ ...prev, [varNum]: val }));
  };



  const handleSend = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', campaignName);
      formData.append('provider', provider);
      formData.append('selectionType', selectionType);
      
      if (selectionType === 'tag') {
        formData.append('tag', selectedTag);
      } else if (selectionType === 'manual') {
        formData.append('contactIds', JSON.stringify(selectedContacts));
      }
      
      if (provider === 'twilio') {
        formData.append('templateSid', selectedTemplate?.sid || '');
        formData.append('templateVariables', JSON.stringify(templateVars));
        if (selectedTwilioAccount) {
          formData.append('twilioAccountId', selectedTwilioAccount.id);
        }
        if (templateMediaUrl) {
          formData.append('mediaUrl', templateMediaUrl);
        }
      } else {
        formData.append('messageText', messageText);
        if (mediaFile) {
          formData.append('media', mediaFile);
        }
      }

      // Appending scheduling options
      formData.append('isScheduled', isScheduled);
      formData.append('scheduledDate', scheduledDate);
      formData.append('scheduledTime', scheduledTime);

      await axios.post(`${API_BASE}/api/campaigns`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage(isScheduled ? 'Campanha agendada com sucesso!' : 'Campanha iniciada com sucesso!');
      setStep(4);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erro ao enviar campanha.');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewText = () => {
    const sampleName = contacts.length > 0 ? contacts[0].nome : 'João Silva';

    if (provider === 'twilio') {
      if (!selectedTemplate) return '';
      let body = getTemplateBody(selectedTemplate);
      
      Object.keys(templateVars).forEach(varNum => {
        let value = templateVars[varNum] || `{{${varNum}}}`;
        value = value.replace(/{{nome}}/g, sampleName);
        body = body.replace(new RegExp(`\\{\\{${varNum}\\}\\}`, 'g'), value);
      });
      return body;
    }
    
    if (!messageText) return '';
    return messageText.replace(/{{nome}}/g, sampleName);
  };

  return (
    <div className="page-container pulse-glow">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1>Nova Campanha</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', margin: 0 }}>
          Crie um novo fluxo de disparos de mensagens automatizadas em 4 etapas simples.
        </p>
      </div>
      
      {/* Progress Stepper with 4 Steps */}
      <div style={styles.stepperContainer}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ 
            width: '23%', 
            height: '6px', 
            background: step === i 
              ? 'var(--accent-flow)' 
              : step > i 
                ? 'var(--accent-primary)' 
                : 'rgba(255,255,255,0.06)',
            borderRadius: '99px',
            boxShadow: step >= i ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 style={styles.stepTitle}>Passo 1: Configurações & Conteúdo</h2>
          
          <div className="campaign-composer-layout">
            <div className="composer-form">
              {/* Campaign Name */}
              <div className="input-group">
                <label>Nome da Campanha</label>
                <input 
                  type="text" 
                  value={campaignName} 
                  onChange={(e) => setCampaignName(e.target.value)} 
                  placeholder="Ex: Ofertas Especiais de Lançamento"
                />
              </div>

              {/* Assigned User */}
              <div className="input-group">
                <label>Atribuir a Cliente/Usuário (Opcional)</label>
                <input 
                  type="text" 
                  value={assignedUser} 
                  onChange={(e) => setAssignedUser(e.target.value)} 
                  placeholder="Nome do cliente dono desta campanha..."
                />
              </div>

              {/* Provider Selection */}
              <div className="input-group">
                <label>Provedor de Mensagem</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ 
                    ...styles.providerBtn, 
                    ...(provider === 'zapi' ? styles.providerBtnActive : {})
                  }}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value="zapi" 
                      checked={provider === 'zapi'}
                      onChange={() => setProvider('zapi')}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{...styles.dotIndicator, background: provider === 'zapi' ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.1)'}} />
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>WhatsApp Padrão</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>WhatsApp Web / Mensagem Livre</span>
                      </div>
                    </div>
                  </label>
                  
                  <label style={{ 
                    ...styles.providerBtn, 
                    ...(provider === 'twilio' ? styles.providerBtnActive : {})
                  }}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value="twilio" 
                      checked={provider === 'twilio'}
                      onChange={() => setProvider('twilio')}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{...styles.dotIndicator, background: provider === 'twilio' ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.1)'}} />
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Twilio</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>WhatsApp Oficial / Templates de Metas</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Composer Inputs choice */}
              {provider === 'twilio' ? (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Twilio Account Select */}
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Enviar através da conta Twilio:</label>
                    <select
                      value={selectedTwilioAccount?.id || ''}
                      onChange={(e) => {
                        const acc = twilioAccounts.find(a => a.id === parseInt(e.target.value));
                        setSelectedTwilioAccount(acc || null);
                        setSelectedTemplate(null);
                        setTemplateVars({});
                      }}
                      required
                    >
                      <option value="">-- Selecione a Conta Twilio --</option>
                      {twilioAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.friendly_name} ({acc.twilio_phone_number})
                        </option>
                      ))}
                    </select>
                    {twilioAccounts.length === 0 && (
                      <small style={{ color: '#f87171', display: 'block', marginTop: '6px' }}>
                        Nenhum perfil de conta Twilio cadastrado! Vá em Configurações para cadastrar um.
                      </small>
                    )}
                  </div>

                  {loadingTemplates ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Carregando templates homologados da Twilio...</p>
                  ) : (
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>Selecione o Modelo (Template)</label>
                      <select 
                        value={selectedTemplate?.sid || ''} 
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        disabled={!selectedTwilioAccount}
                      >
                        <option value="">-- Selecione o Modelo Homologado --</option>
                        {templates.map(t => (
                          <option key={t.sid} value={t.sid}>{t.friendly_name} ({t.language})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedTemplate && (
                    <div style={styles.templateLayoutBox}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Texto do Modelo Base:</strong>
                      <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text-primary)' }}>{getTemplateBody(selectedTemplate)}</p>
                    </div>
                  )}

                  {selectedTemplate && Object.keys(selectedTemplate.types || {}).some(k => k.toLowerCase().includes('media') || k.toLowerCase().includes('card')) && (
                    <div className="input-group" style={{ margin: 0 }}>
                      <label>URL da Mídia (Imagem/Vídeo/PDF) para o Modelo</label>
                      <input 
                        type="text" 
                        value={templateMediaUrl} 
                        onChange={(e) => setTemplateMediaUrl(e.target.value)} 
                        placeholder="https://exemplo.com/imagem.png"
                      />
                      <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '4px' }}>
                        Este modelo requer um arquivo de mídia. Digite a URL pública direta da imagem, vídeo ou PDF.
                      </small>
                    </div>
                  )}

                  {Object.keys(templateVars).map(varNum => (
                    <div className="input-group" key={varNum} style={{ margin: 0 }}>
                      <label>Variável de Preenchimento {`{{${varNum}}}`}</label>
                      <textarea 
                        id={`var-textarea-${varNum}`}
                        rows="2"
                        value={templateVars[varNum]} 
                        onChange={(e) => handleVariableChange(varNum, e.target.value)}
                        placeholder={`Digite um texto fixo ou {{nome}}`}
                        style={{ resize: 'vertical' }}
                      />
                      {provider === 'twilio' && templateVars[varNum] && (/[\r\n]/.test(templateVars[varNum]) || /\s{5,}/.test(templateVars[varNum])) && (
                        <div style={{ color: '#fb923c', fontSize: '0.8rem', marginTop: '4px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ⚠️ A Twilio/Meta proíbe quebras de linha ou mais de 4 espaços seguidos em variáveis. Eles serão limpos no envio. Use Padrão para texto livre formatado.
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <small style={{ color: 'var(--text-tertiary)' }}>
                          Dica: digite <strong>{"{{nome}}"}</strong> para carregar o nome de cada lead.
                        </small>
                        <span style={{ 
                          fontSize: '0.74rem', 
                          color: (templateVars[varNum] || '').length > 1024 ? '#ef4444' : 'var(--text-secondary)', 
                          fontWeight: '600', 
                          padding: '2px 8px', 
                          background: 'rgba(255,255,255,0.03)', 
                          borderRadius: '6px', 
                          border: '1px solid var(--border-glass)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {(templateVars[varNum] || '').length} / 1024
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Mídia de Anexo (Imagem ou Vídeo) - Opcional</label>
                    <div className="file-upload-area" onClick={() => document.getElementById('media-upload').click()} style={{ padding: '1.5rem 1rem' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" style={{ marginBottom: '0.5rem' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: 'white', fontSize: '0.95rem' }}>Clique para enviar mídia</h4>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', margin: 0 }}>
                        {mediaFile ? mediaFile.name : "Formatos suportados: PNG, JPG, MP4"}
                      </p>
                      <input 
                        type="file" 
                        id="media-upload"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label>Conteúdo da Mensagem</label>
                    <textarea 
                      rows="6"
                      value={messageText} 
                      onChange={(e) => setMessageText(e.target.value)} 
                      placeholder="Digite o texto do seu disparo..."
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <small style={{ color: 'var(--text-tertiary)' }}>
                        Escreva <strong>{"{{nome}}"}</strong> para personalizar a mensagem com o nome de cada contato.
                      </small>
                      <span style={{ 
                        fontSize: '0.74rem', 
                        color: (messageText || '').length > 4096 ? '#ef4444' : 'var(--text-secondary)', 
                        fontWeight: '600', 
                        padding: '2px 8px', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-glass)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {(messageText || '').length} / 4096
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Scheduling Configuration */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isScheduled ? '1.25rem' : '0' }}>
                  <div>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '0.98rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      Programar Campanha
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Defina uma data e horário futuro para realizar o envio das mensagens automaticamente.</span>
                  </div>
                  <label style={styles.switchContainer}>
                    <input 
                      type="checkbox" 
                      checked={isScheduled} 
                      onChange={(e) => {
                        setIsScheduled(e.target.checked);
                        if (e.target.checked && !scheduledDate) {
                          // Default to today + tomorrow
                          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                          setScheduledDate(tomorrow.toISOString().split('T')[0]);
                          setScheduledTime("12:00");
                        }
                      }}
                      style={styles.switchInput}
                    />
                    <div style={{...styles.switchSlider, backgroundColor: isScheduled ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}}>
                      <div style={{...styles.switchKnob, transform: isScheduled ? 'translateX(20px)' : 'translateX(0)'}} />
                    </div>
                  </label>
                </div>

                {isScheduled && (
                  <div className="scheduling-fields-row" style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.75rem' }}>Data do Envio</label>
                      <input 
                        type="date" 
                        value={scheduledDate} 
                        onChange={(e) => setScheduledDate(e.target.value)} 
                        onClick={(e) => {
                          try {
                            e.target.showPicker();
                          } catch (err) {
                            console.warn("showPicker is not supported", err);
                          }
                        }}
                        required={isScheduled}
                      />
                    </div>
                    <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '120px' }}>
                      <label style={{ fontSize: '0.75rem' }}>Horário do Envio</label>
                      <input 
                        type="time" 
                        value={scheduledTime} 
                        onChange={(e) => setScheduledTime(e.target.value)} 
                        onClick={(e) => {
                          try {
                            e.target.showPicker();
                          } catch (err) {
                            console.warn("showPicker is not supported", err);
                          }
                        }}
                        required={isScheduled}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStep(2)} 
                disabled={!campaignName || (provider === 'twilio' ? (!selectedTwilioAccount || !selectedTemplate) : (!messageText && !mediaFile)) || (isScheduled && (!scheduledDate || !scheduledTime))}
                style={{ marginTop: '2.5rem', width: '100%' }}
              >
                Continuar para Destinatários
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>

            {/* Smartphone Simulator */}
            <div className="simulator-container">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="whatsapp-header">
                    <span style={{ fontSize: '18px' }}>←</span>
                    <div>
                      <div style={{ fontWeight: '700' }}>Contato Demo</div>
                      <div style={{ fontSize: '11px', opacity: 0.8 }}>online</div>
                    </div>
                  </div>
                  <div className="whatsapp-body">
                    {(getPreviewText() || mediaPreviewUrl || (provider === 'twilio' && templateMediaUrl)) && (
                      <div className="whatsapp-message-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                        {provider === 'twilio' && templateMediaUrl && (
                          templateMediaUrl.toLowerCase().endsWith('.pdf') ? (
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent-secondary)' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{templateMediaUrl}</span>
                            </div>
                          ) : templateMediaUrl.toLowerCase().match(/\.(mp4|avi|mov)$/) ? (
                            <video src={templateMediaUrl} className="whatsapp-media-preview" controls />
                          ) : (
                            <img src={templateMediaUrl} alt="Template Preview" className="whatsapp-media-preview" onError={(e) => { e.target.style.display = 'none'; }} />
                          )
                        )}
                        {mediaPreviewUrl && (
                          mediaFile?.type?.startsWith('video/') ? (
                            <video src={mediaPreviewUrl} className="whatsapp-media-preview" controls />
                          ) : (
                            <img src={mediaPreviewUrl} alt="Preview" className="whatsapp-media-preview" />
                          )
                        )}
                        {getPreviewText()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={styles.stepTitle}>Passo 2: Seleção de Destinatários</h2>
          </div>

          {/* Tag Filter Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                Filtrar por Tag:
              </span>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                style={{ 
                  margin: 0, 
                  padding: '0.45rem 1rem', 
                  borderRadius: '8px', 
                  fontSize: '0.88rem',
                  background: 'rgba(15, 23, 42, 0.45)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todas as tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            
            <button 
              type="button" 
              onClick={handleSelectAllContacts}
              className="secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', borderRadius: '8px', margin: 0 }}
            >
              {selectionType === 'all' 
                ? 'Desmarcar Todos'
                : selectionType === 'tag'
                  ? `Desmarcar todos da tag "${selectedTag}"`
                  : selectedTag 
                    ? `Selecionar todos da tag "${selectedTag}"`
                    : 'Selecionar Todos da Base'
              }
            </button>
          </div>

          {selectionType !== 'manual' && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              borderRadius: '8px', 
              padding: '0.75rem 1.25rem', 
              marginBottom: '1rem',
              color: '#34d399',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              {selectionType === 'all' 
                ? `Todos os contatos da base (${totalContacts}) foram selecionados!` 
                : `Todos os contatos com a tag "${selectedTag}" (${totalContacts}) foram selecionados!`
              }
            </div>
          )}
          
          <div style={styles.contactsScrollContainer}>
            {contacts.map(c => {
              const isChecked = selectionType === 'all' || (selectionType === 'tag' && c.flag === selectedTag) || selectedContacts.includes(c.id);
              return (
                <label key={c.id} style={{ 
                  ...styles.contactCheckRow,
                  ...(isChecked ? styles.contactCheckRowActive : {})
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      disabled={selectionType !== 'manual'}
                      onChange={() => handleSelectContact(c.id)} 
                      style={{ width: '18px', height: '18px', cursor: selectionType === 'manual' ? 'pointer' : 'default', accentColor: 'var(--accent-secondary)' }}
                    />
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.nome}</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({c.telefone})</span>
                  </div>
                  <span className="badge" style={{ background: 'var(--accent-indigo-light)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    {c.flag}
                  </span>
                </label>
              );
            })}
            {contacts.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Nenhum contato encontrado na base de dados.</p>
            )}
          </div>

          {/* Contact Selector Pagination Controls */}
          {totalContacts > 10 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '1.25rem', 
              padding: '1rem', 
              border: '1px solid var(--border-glass)', 
              borderRadius: 'var(--radius-md)',
              background: 'rgba(10, 15, 30, 0.2)',
              marginBottom: '2rem'
            }}>
              <button 
                onClick={() => setContactsPage(prev => Math.max(prev - 1, 1))} 
                disabled={contactsPage === 1}
                className="secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', minWidth: '80px', margin: 0 }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Página {contactsPage} de {totalContactsPages}
              </span>
              <button 
                onClick={() => setContactsPage(prev => Math.min(prev + 1, totalContactsPages))} 
                disabled={contactsPage === totalContactsPages}
                className="secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', minWidth: '80px', margin: 0 }}
              >
                Próxima
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button onClick={() => setStep(1)} className="secondary">Voltar</button>
            <button 
              onClick={() => setStep(3)} 
              disabled={selectionType === 'manual' ? selectedContacts.length === 0 : totalContacts === 0} 
              style={{ flex: 1 }}
            >
              Revisar Campanha
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'left' }}>
          <h2 style={styles.stepTitle}>Passo 3: Sumário de Validação</h2>
          
          <div style={styles.summaryCard}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <strong style={styles.sumLabel}>NOME DO FLUXO:</strong>
                <p style={styles.sumText}>{campaignName}</p>
              </div>
              
              <div>
                <strong style={styles.sumLabel}>PROVEDOR ESCOLHIDO:</strong>
                <p style={{ ...styles.sumText, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>{provider}</p>
              </div>

              {provider === 'twilio' && selectedTwilioAccount && (
                <div>
                  <strong style={styles.sumLabel}>CONTA DE ENVIO (TWILIO):</strong>
                  <p style={styles.sumText}>{selectedTwilioAccount.friendly_name} ({selectedTwilioAccount.twilio_phone_number})</p>
                </div>
              )}

              <div>
                <strong style={styles.sumLabel}>ALVO DE TRANSMISSÃO:</strong>
                <p style={styles.sumText}>
                  {selectionType === 'all' 
                    ? `Todos os contatos (${totalContacts} no total)`
                    : selectionType === 'tag'
                      ? `Todos os contatos da tag: "${selectedTag}" (${totalContacts} no total)`
                      : `${selectedContacts.length} contatos selecionados`
                  }
                </p>
              </div>

              <div>
                <strong style={styles.sumLabel}>CRONOGRAMA DE ENVIO:</strong>
                <p style={{ ...styles.sumText, color: isScheduled ? 'var(--accent-secondary)' : '#34d399' }}>
                  {isScheduled 
                    ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Agendado para {new Date(scheduledDate + 'T00:00:00').toLocaleDateString()} às {scheduledTime}
                      </span>
                    )
                    : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        Envio Imediato
                      </span>
                    )
                  }
                </p>
              </div>
            </div>

            {provider === 'twilio' ? (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                <strong style={styles.sumLabel}>TEMPLATE OFICIAL (TWILIO):</strong>
                <p style={{ margin: '0.25rem 0 1rem 0', fontWeight: '600', fontSize: '1.02rem' }}>{selectedTemplate?.friendly_name} (<code>{selectedTemplate?.sid}</code>)</p>
                
                {templateMediaUrl && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <strong style={styles.sumLabel}>URL DA MÍDIA DO TEMPLATE:</strong>
                    <span style={styles.mediaAttachmentInfo}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                      {templateMediaUrl}
                    </span>
                  </div>
                )}

                <strong style={styles.sumLabel}>VARIAÇÕES DE CONTEÚDO:</strong>
                <div style={styles.sampleVariablesList}>
                  {Object.entries(templateVars).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: '6px', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                      <strong style={{ color: 'var(--accent-secondary)' }}>{`{{${key}}}`}:</strong> {val || <span style={{ color: '#f87171' }}>[Vazio]</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                <strong style={styles.sumLabel}>TEXTO ENVIADO:</strong>
                <p style={styles.previewMessageText}>
                  {messageText || <em style={{ color: 'var(--text-tertiary)' }}>[Nenhum texto inserido]</em>}
                </p>
                {mediaFile && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <strong style={styles.sumLabel}>ARQUIVO DE MÍDIA ANEXADO:</strong>
                    <span style={styles.mediaAttachmentInfo}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                      {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setStep(2)} className="secondary" disabled={loading}>Voltar</button>
            <button onClick={handleSend} disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Disparando fluxo de mensagens...' : 'Confirmar & Lançar Disparos'}
              {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={styles.successIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Sucesso!</h2>
          <p className={message.includes('sucesso') ? 'success-message' : 'error-message'} style={{ maxWidth: '450px', margin: '0 auto 2rem auto' }}>{message}</p>
          <button onClick={() => navigate('/campaigns')}>
            Ir para Histórico de Campanhas
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  stepperContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '3rem'
  },
  stepTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: 'white'
  },
  providerBtn: {
    flex: 1,
    minWidth: '220px',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  providerBtnActive: {
    background: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'var(--accent-primary)',
    boxShadow: 'var(--shadow-glow)'
  },
  dotIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  },
  templateLayoutBox: {
    marginBottom: '1rem',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    padding: '1.25rem',
    background: 'rgba(0,0,0,0.15)'
  },
  contactsScrollContainer: {
    maxHeight: '380px',
    overflowY: 'auto',
    marginBottom: '2rem',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    background: 'rgba(15, 23, 42, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  contactCheckRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    background: 'rgba(255,255,255,0.01)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  contactCheckRowActive: {
    background: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.15)'
  },
  summaryCard: {
    background: 'rgba(15, 23, 42, 0.35)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    marginBottom: '2.5rem',
    boxShadow: 'var(--shadow-sm)'
  },
  sumLabel: {
    color: 'var(--text-tertiary)',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase'
  },
  sumText: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1.15rem',
    color: 'var(--text-primary)'
  },
  sampleVariablesList: {
    background: 'rgba(0,0,0,0.15)',
    padding: '1.25rem',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)',
    marginTop: '0.75rem'
  },
  previewMessageText: {
    margin: '0.5rem 0 0 0',
    whiteSpace: 'pre-wrap',
    background: 'rgba(0,0,0,0.15)',
    padding: '1.25rem',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)',
    lineHeight: '1.5',
    color: 'var(--text-primary)',
    fontSize: '0.98rem'
  },
  mediaAttachmentInfo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.92rem',
    color: 'var(--accent-secondary)',
    fontWeight: '600',
    marginTop: '0.5rem',
    background: 'var(--accent-cyan-light)',
    padding: '4px 12px',
    borderRadius: '6px'
  },
  successIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'var(--accent-green-light)',
    color: '#34d399',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem auto',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  },
  switchContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative'
  },
  switchInput: {
    display: 'none'
  },
  switchSlider: {
    width: '46px',
    height: '24px',
    borderRadius: '99px',
    padding: '2px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s'
  },
  switchKnob: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s'
  }
};

export default NewCampaign;
