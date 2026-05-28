import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Contacts = ({ token }) => {
  const [file, setFile] = useState(null);
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  // Backend Pagination & Search/Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [search, setSearch] = useState('');
  const [contactsPerPage, setContactsPerPage] = useState(10);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await axios.get(`${API_BASE}/api/contacts`, {
        params: {
          page: currentPage,
          limit: contactsPerPage,
          flag: selectedTag || undefined,
          search: search || undefined
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle either paginated object or fallback array response
      if (response.data && response.data.contacts) {
        setContacts(response.data.contacts);
        setTotalContacts(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        setContacts(response.data || []);
        setTotalContacts(response.data ? response.data.length : 0);
        setTotalPages(response.data ? Math.max(Math.ceil(response.data.length / contactsPerPage), 1) : 1);
      }
    } catch (err) {
      console.error('Error fetching contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/contacts/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTags(response.data);
    } catch (err) {
      console.error('Error fetching tags', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) return;
    
    try {
      await axios.delete(`${API_BASE}/api/contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchContacts();
      fetchTags();
    } catch (err) {
      console.error('Erro ao excluir contato:', err);
      alert('Erro ao excluir o contato.');
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = () => {
    const pageIds = contacts.map(c => c.id);
    const allSelectedOnPage = pageIds.every(id => selectedIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const additions = pageIds.filter(id => !prev.includes(id));
        return [...prev, ...additions];
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir os ${selectedIds.length} contatos selecionados?`)) return;
    try {
      await axios.post(`${API_BASE}/api/contacts/bulk-delete`, { ids: selectedIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds([]);
      fetchContacts();
      fetchTags();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir contatos em lote.');
    }
  };

  const handleDeleteByTag = async () => {
    if (!selectedTag) return;
    if (!window.confirm(`Tem certeza que deseja excluir TODOS os contatos associados à tag "${selectedTag}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.post(`${API_BASE}/api/contacts/delete-by-tag`, { tag: selectedTag }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTag('');
      fetchContacts();
      fetchTags();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir contatos por tag.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchTags();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token, currentPage, selectedTag, search, contactsPerPage]);

  // Safety check: if currentPage exceeds totalPages (e.g. after deletion), adjust it
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !flag) {
      setMessage('Por favor, selecione um arquivo e defina uma flag.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('flag', flag);

    try {
      await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setMessage('Planilha enviada com sucesso!');
      setFile(null);
      setFlag('');
      setCurrentPage(1); // Reset to page 1 on new import
      fetchContacts();
    } catch (err) {
      setMessage('Erro ao processar planilha.');
      console.error(err);
    }
  };

  return (
    <div className="page-container pulse-glow">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Contatos</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
          Importe novas planilhas de leads e gerencie sua base de contatos cadastrados.
        </p>
      </div>
      
      {/* Action panel (Download sample & Import) */}
      <div className="contacts-action-panel" style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        
        {/* Upload Form Box */}
        <form onSubmit={handleUpload} className="card-gradient" style={styles.formContainer}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.25rem' }}>Importar Novo Lote</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group" style={{ margin: 0, width: '100%' }}>
              <label>Flag de Identificação (Obrigatório)</label>
              <input 
                type="text" 
                value={flag} 
                onChange={(e) => setFlag(e.target.value)} 
                placeholder="Ex: leads_agosto_2026"
              />
              <small style={{ color: 'var(--text-tertiary)', display: 'block', marginTop: '6px', fontSize: '0.8rem' }}>
                Preencha a flag antes de selecionar a planilha.
              </small>
            </div>
            
            <label className="file-upload-area pulse-hover" style={{ padding: '3rem 1rem', width: '100%', boxSizing: 'border-box' }}>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={(e) => {
                  const selected = e.target.files[0];
                  setFile(selected);
                  // We simulate form submission implicitly if flag is set, else we wait for the user
                  // Because the form uses handleUpload on submit, let's keep the submit button but hide it
                }} 
                style={{ display: 'none' }} 
              />
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5EFF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 8px rgba(94,255,0,0.4))' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span style={{ fontWeight: '800', color: 'white', fontSize: '1.2rem', marginBottom: '8px' }}>
                {file ? file.name : 'Clique para Enviar Planilha'}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Suporta .XLSX, .XLS ou .CSV</span>
            </label>
            
            {file && (
              <button type="submit" style={{ width: 'fit-content', borderRadius: 'var(--radius-sm)', animation: 'fadeIn 0.3s ease-out' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Confirmar Importação
              </button>
            )}
            

          </div>

          {message && (
            <p className={message.includes('sucesso') ? 'success-message' : 'error-message'} style={{ marginBottom: 0, marginTop: '1rem' }}>
              {message}
            </p>
          )}
        </form>

        {/* Info Box removed as requested */}
      </div>

      {/* List of Contacts */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Lista de Contatos
        <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>
          {totalContacts} no total
        </span>
      </h2>

      {/* Search & Filter Section */}
      <div className="filter-section" style={styles.filterSection}>
        <div className="filter-input-group" style={styles.filterInputGroup}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ marginRight: '8px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
            className="no-border-input"
            style={styles.searchInput}
          />
        </div>
        <div className="contacts-filter-row-right" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '250px' }}>
          <div className="filter-input-group" style={styles.filterInputGroup}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginRight: '8px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Filtrar Tag:
            </span>
            <select 
              value={selectedTag} 
              onChange={(e) => { setSelectedTag(e.target.value); setCurrentPage(1); }} 
              className="no-border-select"
              style={styles.tagSelect}
            >
              <option value="">Todas as tags</option>
              {tags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {selectedTag && (
            <button 
              type="button" 
              className="danger" 
              onClick={handleDeleteByTag} 
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', boxShadow: 'none', margin: 0, whiteSpace: 'nowrap' }}
              title={`Deletar todos os contatos da tag "${selectedTag}"`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Excluir Tag
            </button>
          )}
        </div>
      </div>

      {loadingContacts ? (
        <p style={{ color: 'var(--text-secondary)' }}>Carregando contatos cadastrados...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={contacts.length > 0 && contacts.every(c => selectedIds.includes(c.id))}
                    onChange={handleSelectAllPage}
                  />
                </th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Grupo (Flag)</th>
                <th>Importado em</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} style={{ backgroundColor: selectedIds.includes(c.id) ? 'rgba(16, 185, 129, 0.03)' : 'transparent' }}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(c.id)}
                      onChange={() => handleSelectRow(c.id)}
                    />
                  </td>
                  <td style={{ fontWeight: '600' }}>{c.nome}</td>
                  <td style={{ fontFamily: 'monospace', color: '#ffffff' }}>{c.telefone}</td>
                  <td>
                    <span className="badge" style={{ background: 'var(--accent-indigo-light)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                      {c.flag}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {new Date(c.created_at).toLocaleDateString()} às {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="btn-delete-modern"
                      title="Excluir Contato"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" style={{ marginBottom: '1rem' }}><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Nenhum contato encontrado na base de dados.</p>
            </div>
          )}
          
          {/* Pagination Controls */}
          {contacts.length > 0 && (
            <div style={styles.paginationContainer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Exibir:</span>
                <select
                  value={contactsPerPage}
                  onChange={(e) => {
                    setContactsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.35rem 1.75rem 0.35rem 0.75rem',
                    fontSize: '0.82rem',
                    backgroundPosition: 'right 0.6rem center',
                    width: '80px',
                    borderRadius: '6px',
                    margin: 0
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginLeft: 'auto' }}>
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
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="card-gradient" style={styles.floatingBar}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              {selectedIds.length} {selectedIds.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
            </span>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setSelectedIds([])} 
                className="secondary" 
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', margin: 0, boxShadow: 'none' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleBulkDelete} 
                className="danger" 
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', borderRadius: '8px', margin: 0, boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Excluir Selecionados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  formContainer: {
    flex: 2,
    minWidth: '320px',
    padding: '2rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-glass)',
    boxShadow: 'var(--shadow-sm)'
  },
  infoContainer: {
    flex: 1,
    minWidth: '250px',
    background: 'rgba(16, 185, 129, 0.04)',
    padding: '2rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(16, 185, 129, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)'
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none',
    padding: '0.9rem 1.5rem',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  deleteButton: {
    background: 'transparent',
    padding: '0.5rem',
    color: '#ef4444',
    border: 'none',
    boxShadow: 'none',
    minWidth: 'auto',
    display: 'inline-flex',
    transition: 'all 0.2s',
    borderRadius: '8px'
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
  },
  floatingBar: {
    position: 'fixed',
    bottom: '2rem',
    left: '55%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 320px)',
    maxWidth: '750px',
    background: 'rgba(5, 7, 16, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    padding: '1rem 2rem',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(239, 68, 68, 0.1)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    animation: 'pulseGlow 4s infinite ease-in-out'
  }
};

export default Contacts;
