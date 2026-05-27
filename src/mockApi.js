import axios from 'axios';

// Helper to initialize and retrieve LocalStorage tables
const getStorageItem = (key, defaultValue) => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
};

const setStorageItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initial Sample Datasets
const initialContacts = [
  { id: 1, nome: "Lucas Santos", telefone: "5511999990001", flag: "leads_agosto_2026", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 2, nome: "Leandro Costa", telefone: "5521999990002", flag: "leads_agosto_2026", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 3, nome: "Clara Oliveira", telefone: "5511999990003", flag: "leads_agosto_2026", created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 4, nome: "Mateus Silva", telefone: "5531999990004", flag: "leads_agosto_2026", created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 5, nome: "Bruna Ferreira", telefone: "5541999990005", flag: "leads_agosto_2026", created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 6, nome: "Pedro Alencar", telefone: "5511999990006", flag: "leads_vip", created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 7, nome: "Amanda Melo", telefone: "5521999990007", flag: "leads_vip", created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 8, nome: "Rafael Souza", telefone: "5511999990008", flag: "leads_vip", created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 9, nome: "Julia Martins", telefone: "5531999990009", flag: "clientes_antigos", created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 10, nome: "Rodrigo Santos", telefone: "5541999990010", flag: "clientes_antigos", created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 11, nome: "Fernanda Lima", telefone: "5511999990011", flag: "clientes_antigos", created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: 12, nome: "Thiago Rocha", telefone: "5521999990012", flag: "clientes_antigos", created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 13, nome: "Camila Alves", telefone: "5531999990013", flag: "leads_geral", created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 14, nome: "Vinicius Castro", telefone: "5541999990014", flag: "leads_geral", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 15, nome: "Gustavo Henrique", telefone: "5511988880015", flag: "leads_vip", created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 16, nome: "Patrícia Souza", telefone: "5511977770016", flag: "prospects", created_at: new Date().toISOString() },
  { id: 17, nome: "Roberto Carlos", telefone: "5521966660017", flag: "prospects", created_at: new Date().toISOString() },
  { id: 18, nome: "Aline Mendes", telefone: "5531955550018", flag: "leads_geral", created_at: new Date().toISOString() },
  { id: 19, nome: "Sofia Rezende", telefone: "5541944440019", flag: "leads_geral", created_at: new Date().toISOString() },
  { id: 20, nome: "Diego Brandão", telefone: "5511933330020", flag: "leads_inativos", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 21, nome: "Beatriz Neves", telefone: "5511922220021", flag: "leads_inativos", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 22, nome: "Fabiano Silveira", telefone: "5521911110022", flag: "leads_agosto_2026", created_at: new Date().toISOString() },
  { id: 23, nome: "Gisele Bündchen", telefone: "5511900000023", flag: "leads_vip", created_at: new Date().toISOString() }
];

const initialTwilioAccounts = [
  { id: 1, friendly_name: "Suporte Principal", twilio_account_sid: "AC88390b14aa90bc771de99001ab", twilio_auth_token: "auth_token_secret_1", twilio_phone_number: "+14155238886" },
  { id: 2, friendly_name: "Equipe Comercial", twilio_account_sid: "AC4489a24cde89bf992e10034cd", twilio_auth_token: "auth_token_secret_2", twilio_phone_number: "+14155238887" }
];

const initialCampaigns = [
  {
    id: 1,
    name: "Lançamento Oficial VIP",
    provider: "zapi",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    total_sent: 120,
    total_delivered: 118,
    total_read: 104,
    status: "completed",
    contact_flag: "leads_vip",
    message_text: "Olá {{nome}}, seja muito bem-vindo ao grupo de fundadores MassFlow! Desfrute de acesso antecipado hoje mesmo."
  },
  {
    id: 2,
    name: "Ofertas Exclusivas de Inverno",
    provider: "twilio",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_sent: 500,
    total_delivered: 480,
    total_read: 395,
    status: "completed",
    contact_flag: "leads_agosto_2026",
    template_sid: "template_promotion",
    twilio_account_name: "Suporte Principal",
    template_variables: JSON.stringify({ 1: "Cliente", 2: "INVERNO20", 3: "20" })
  },
  {
    id: 3,
    name: "Aviso de Renovação Agendada",
    provider: "twilio",
    created_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_sent: 4,
    total_delivered: 0,
    total_read: 0,
    status: "scheduled",
    contact_flag: "clientes_antigos",
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduled_time: "14:30",
    template_sid: "template_alert",
    twilio_account_name: "Equipe Comercial",
    template_variables: JSON.stringify({ 1: "Parceiro", 2: "30/05/2026" })
  },
  {
    id: 4,
    name: "Agradecimento de Cadastro",
    provider: "twilio",
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    total_sent: 350,
    total_delivered: 348,
    total_read: 320,
    status: "completed",
    contact_flag: "leads_geral",
    template_sid: "template_welcome",
    twilio_account_name: "Suporte Principal",
    template_variables: JSON.stringify({ 1: "Guilherme", 2: "FLOW-9928" })
  },
  {
    id: 5,
    name: "Recuperação de Leads Inativos",
    provider: "zapi",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    total_sent: 80,
    total_delivered: 75,
    total_read: 12,
    status: "sending",
    contact_flag: "leads_inativos",
    message_text: "Sentimos sua falta {{nome}}! Faz tempo que você não acessa o painel da MassFlow. Use o cupom VOLTOU e ganhe 50% de desconto."
  },
  {
    id: 6,
    name: "Promoção Dia das Mães 2026",
    provider: "zapi",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_sent: 95,
    total_delivered: 80,
    total_read: 65,
    status: "paused",
    contact_flag: "prospects",
    message_text: "Preparamos algo muito especial para a sua mãe! Clique no link e garanta o presente dela com entrega expressa grátis."
  }
];

const initialSettings = {
  messaging_provider: "zapi",
  zapi_instance_id: "3B9A88F1100C",
  zapi_token: "zapi_token_demo_9921",
  zapi_client_token: "client_sec_8849",
  base_url: "https://disparos.massflow.com.br"
};

const initialTwilioTemplates = [
  {
    sid: "template_welcome",
    friendly_name: "Boas-vindas ao MassFlow (welcome_template)",
    language: "pt_BR",
    types: {
      "twilio/text": {
        body: "Olá {{1}}, muito obrigado por se cadastrar na MassFlow! Seu código de acesso exclusivo é {{2}}."
      }
    }
  },
  {
    sid: "template_promotion",
    friendly_name: "Cupom Promocional (winter_coupon)",
    language: "pt_BR",
    types: {
      "twilio/text": {
        body: "Olá {{1}}! Preparamos um presente especial para você. Utilize o cupom {{2}} nas próximas 24h e ganhe {{3}}% de desconto em todo o nosso site!"
      }
    }
  },
  {
    sid: "template_alert",
    friendly_name: "Lembrete de Vencimento de Alta Prioridade (invoice_reminder)",
    language: "pt_BR",
    types: {
      "twilio/text": {
        body: "Atenção {{1}}: Lembramos que sua fatura MassFlow com vencimento em {{2}} já está disponível para pagamento no painel. Evite multas efetuando o pagamento hoje."
      }
    }
  }
];

// Axios global request interceptor for Mock Interception
axios.interceptors.request.use((config) => {
  // We match any URL containing '/api/'
  if (config.url && config.url.includes('/api/')) {
    config.adapter = async (cfg) => {
      const url = cfg.url;
      const method = cfg.method.toUpperCase();
      
      // Parse query params if available
      const urlObj = new URL(url, 'https://localhost');
      const pathname = urlObj.pathname;
      const params = Object.fromEntries(urlObj.searchParams);
      
      // Load tables from LocalStorage
      let contacts = getStorageItem('mf_contacts', initialContacts);
      let twilioAccounts = getStorageItem('mf_twilio_accounts', initialTwilioAccounts);
      let campaigns = getStorageItem('mf_campaigns', initialCampaigns);
      let settings = getStorageItem('mf_settings', initialSettings);
      
      // MOCK ROUTING TABLE
      
      // 1. POST /api/login
      if (pathname.endsWith('/api/login') && method === 'POST') {
        return {
          data: { token: "mock-jwt-token-xyz-" + Date.now() },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }

      // 1b. POST /api/register
      if (pathname.endsWith('/api/register') && method === 'POST') {
        return {
          data: { token: "mock-jwt-token-register-" + Date.now() },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 2. GET /api/contacts/tags
      if (pathname.endsWith('/api/contacts/tags') && method === 'GET') {
        const uniqueFlags = [...new Set(contacts.map(c => c.flag).filter(Boolean))];
        return {
          data: uniqueFlags,
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 3. GET /api/contacts
      if (pathname.endsWith('/api/contacts') && method === 'GET') {
        let filtered = [...contacts];
        
        // Filter by Tag / Flag
        if (params.flag) {
          filtered = filtered.filter(c => c.flag === params.flag);
        }
        
        // Filter by Search String (nome or telefone)
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(c => 
            c.nome.toLowerCase().includes(s) || 
            c.telefone.includes(s)
          );
        }
        
        // Sort descending by creation date
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Paginate
        const page = parseInt(params.page || 1);
        const limit = parseInt(params.limit || 10);
        const total = filtered.length;
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        const sliced = filtered.slice((page - 1) * limit, page * limit);
        
        return {
          data: {
            contacts: sliced,
            total,
            totalPages,
            currentPage: page
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 4. DELETE /api/contacts/:id
      const singleContactMatch = pathname.match(/\/api\/contacts\/(\d+)$/);
      if (singleContactMatch && method === 'DELETE') {
        const idToDelete = parseInt(singleContactMatch[1]);
        const updated = contacts.filter(c => c.id !== idToDelete);
        setStorageItem('mf_contacts', updated);
        return {
          data: { success: true, message: "Contato deletado com sucesso." },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 5. POST /api/contacts/bulk-delete (bulk action)
      if (pathname.endsWith('/api/contacts/bulk-delete') && method === 'POST') {
        const payload = JSON.parse(cfg.data || '{}');
        const idsToDelete = payload.ids || [];
        const updated = contacts.filter(c => !idsToDelete.includes(c.id));
        setStorageItem('mf_contacts', updated);
        return {
          data: { success: true, count: idsToDelete.length, message: "Contatos deletados em lote." },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 6. POST /api/contacts/delete-by-tag (delete all with tag)
      if (pathname.endsWith('/api/contacts/delete-by-tag') && method === 'POST') {
        const payload = JSON.parse(cfg.data || '{}');
        const tagToDelete = payload.tag || '';
        const beforeCount = contacts.length;
        const updated = contacts.filter(c => c.flag !== tagToDelete);
        const deletedCount = beforeCount - updated.length;
        setStorageItem('mf_contacts', updated);
        return {
          data: { success: true, count: deletedCount, message: `Todos os contatos da tag "${tagToDelete}" foram removidos.` },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 7. POST /api/upload
      if (pathname.endsWith('/api/upload') && method === 'POST') {
        // Enforce parsing FormData or query parameters
        let flagName = "leads_importados";
        if (cfg.data instanceof FormData) {
          flagName = cfg.data.get('flag') || flagName;
        } else if (typeof cfg.data === 'string') {
          // Fallback parsing of raw body
          const match = cfg.data.match(/name="flag"[\r\n\s]+([^\r\n-]+)/);
          if (match) flagName = match[1].trim();
        }
        
        // Generate 5 realistic mock contacts for that flag
        const baseId = Date.now();
        const generated = [
          { id: baseId + 1, nome: "Guilherme Silva", telefone: "5511998881234", flag: flagName, created_at: new Date().toISOString() },
          { id: baseId + 2, nome: "Mariana Costa", telefone: "5521997775678", flag: flagName, created_at: new Date().toISOString() },
          { id: baseId + 3, nome: "Felipe Andrade", telefone: "5531988884321", flag: flagName, created_at: new Date().toISOString() },
          { id: baseId + 4, nome: "Letícia Ribeiro", telefone: "5541999998765", flag: flagName, created_at: new Date().toISOString() },
          { id: baseId + 5, nome: "Daniel Oliveira", telefone: "5511995554321", flag: flagName, created_at: new Date().toISOString() }
        ];
        
        const updated = [...contacts, ...generated];
        setStorageItem('mf_contacts', updated);
        
        return {
          data: { success: true, message: `Planilha importada! 5 contatos adicionados ao grupo "${flagName}"` },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 8. GET /api/campaigns
      if (pathname.endsWith('/api/campaigns') && method === 'GET') {
        // Sort campaigns newest first
        const sorted = [...campaigns].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return {
          data: sorted,
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 9. POST /api/campaigns
      if (pathname.endsWith('/api/campaigns') && method === 'POST') {
        let name = "";
        let provider = "zapi";
        let selectionType = "all";
        let contactFlag = "";
        let templateSid = "";
        let templateVariables = "{}";
        let messageText = "";
        let twilioAccountId = null;
        let mediaFileName = "";
        
        // Agendamento variables
        let isScheduled = false;
        let scheduledDate = "";
        let scheduledTime = "";
        
        // Extract values from FormData
        if (cfg.data instanceof FormData) {
          name = cfg.data.get('name') || "";
          provider = cfg.data.get('provider') || "zapi";
          selectionType = cfg.data.get('selectionType') || "all";
          contactFlag = cfg.data.get('tag') || "";
          templateSid = cfg.data.get('templateSid') || "";
          templateVariables = cfg.data.get('templateVariables') || "{}";
          messageText = cfg.data.get('messageText') || "";
          twilioAccountId = cfg.data.get('twilioAccountId') ? parseInt(cfg.data.get('twilioAccountId')) : null;
          
          const media = cfg.data.get('media');
          if (media && media.name) mediaFileName = media.name;
          
          isScheduled = cfg.data.get('isScheduled') === 'true';
          scheduledDate = cfg.data.get('scheduledDate') || "";
          scheduledTime = cfg.data.get('scheduledTime') || "";
        } else {
          // Fallback JSON body
          const body = JSON.parse(cfg.data || '{}');
          name = body.name || "";
          provider = body.provider || "zapi";
          selectionType = body.selectionType || "all";
          contactFlag = body.tag || "";
          templateSid = body.templateSid || "";
          templateVariables = JSON.stringify(body.templateVariables || {});
          messageText = body.messageText || "";
          twilioAccountId = body.twilioAccountId || null;
          isScheduled = !!body.isScheduled;
          scheduledDate = body.scheduledDate || "";
          scheduledTime = body.scheduledTime || "";
        }
        
        // Resolve selected flag target if selection type is 'all' or 'manual'
        if (selectionType === 'all') {
          contactFlag = "Toda a Base";
        } else if (selectionType === 'manual') {
          contactFlag = "Lista Manual";
        }
        
        // Determine Twilio account name if Twilio is used
        let twilioAccountName = "";
        if (provider === 'twilio' && twilioAccountId) {
          const acc = twilioAccounts.find(a => a.id === twilioAccountId);
          if (acc) twilioAccountName = acc.friendly_name;
        }
        
        // Calculate realistic totals based on the targeted audience
        let targetCount = 0;
        if (selectionType === 'all') {
          targetCount = contacts.length;
        } else if (selectionType === 'tag') {
          targetCount = contacts.filter(c => c.flag === contactFlag).length;
        } else if (cfg.data instanceof FormData && cfg.data.get('contactIds')) {
          try {
            targetCount = JSON.parse(cfg.data.get('contactIds')).length;
          } catch(e) { targetCount = 1; }
        } else {
          targetCount = 1;
        }
        
        const newCamp = {
          id: Date.now(),
          name,
          provider,
          created_at: new Date().toISOString(),
          total_sent: targetCount,
          total_delivered: isScheduled ? 0 : Math.max(0, targetCount - Math.floor(Math.random() * (targetCount * 0.05))), // 95%+ delivered
          total_read: isScheduled ? 0 : Math.max(0, targetCount - Math.floor(Math.random() * (targetCount * 0.25))), // 75%+ read
          status: isScheduled ? "scheduled" : "sending",
          contact_flag: contactFlag || "Contatos Selecionados",
          template_sid: templateSid || undefined,
          twilio_account_name: twilioAccountName || undefined,
          template_variables: templateVariables,
          message_text: messageText,
          media_path: mediaFileName ? `/uploads/${mediaFileName}` : undefined,
          scheduled_date: isScheduled ? scheduledDate : undefined,
          scheduled_time: isScheduled ? scheduledTime : undefined
        };
        
        const updated = [newCamp, ...campaigns];
        setStorageItem('mf_campaigns', updated);
        
        // If not scheduled, simulate completed delivery in 8 seconds
        if (!isScheduled) {
          setTimeout(() => {
            const currentCampaigns = getStorageItem('mf_campaigns', []);
            const campIndex = currentCampaigns.findIndex(c => c.id === newCamp.id);
            if (campIndex !== -1 && currentCampaigns[campIndex].status === 'sending') {
              currentCampaigns[campIndex].status = 'completed';
              setStorageItem('mf_campaigns', currentCampaigns);
            }
          }, 8000);
        }
        
        return {
          data: { success: true, campaign: newCamp, message: isScheduled ? "Campanha agendada com sucesso!" : "Campanha disparada com sucesso!" },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 10. POST /api/campaigns/:id/status (pausing/stopping campaigns)
      const campaignStatusMatch = pathname.match(/\/api\/campaigns\/(\d+)\/status$/);
      if (campaignStatusMatch && method === 'POST') {
        const campId = parseInt(campaignStatusMatch[1]);
        const body = JSON.parse(cfg.data || '{}');
        const newStatus = body.status || 'sending';
        
        const updated = campaigns.map(c => {
          if (c.id === campId) {
            return { ...c, status: newStatus };
          }
          return c;
        });
        setStorageItem('mf_campaigns', updated);
        
        return {
          data: { success: true, message: `Status da campanha alterado para ${newStatus}` },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 11. POST /api/campaigns/:id/resend
      const campaignResendMatch = pathname.match(/\/api\/campaigns\/(\d+)\/resend$/);
      if (campaignResendMatch && method === 'POST') {
        const idToResend = parseInt(campaignResendMatch[1]);
        const original = campaigns.find(c => c.id === idToResend);
        if (!original) {
          return {
            data: { message: "Campanha não encontrada." },
            status: 404,
            statusText: "Not Found",
            headers: {},
            config: cfg
          };
        }
        
        const cloned = {
          ...original,
          id: Date.now(),
          name: `${original.name} (Reenvio)`,
          created_at: new Date().toISOString(),
          status: "sending",
          total_delivered: Math.max(0, original.total_sent - Math.floor(Math.random() * (original.total_sent * 0.05))),
          total_read: Math.max(0, original.total_sent - Math.floor(Math.random() * (original.total_sent * 0.25))),
        };
        
        const updated = [cloned, ...campaigns];
        setStorageItem('mf_campaigns', updated);
        
        // Auto mark as completed after 5 seconds
        setTimeout(() => {
          const currentCampaigns = getStorageItem('mf_campaigns', []);
          const index = currentCampaigns.findIndex(c => c.id === cloned.id);
          if (index !== -1 && currentCampaigns[index].status === 'sending') {
            currentCampaigns[index].status = 'completed';
            setStorageItem('mf_campaigns', currentCampaigns);
          }
        }, 5000);
        
        return {
          data: { success: true, message: "Campanha duplicada e colocada na fila de disparos!" },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 12. GET /api/twilio-accounts
      if (pathname.endsWith('/api/twilio-accounts') && method === 'GET') {
        return {
          data: twilioAccounts,
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 13. POST /api/twilio-accounts
      if (pathname.endsWith('/api/twilio-accounts') && method === 'POST') {
        const body = JSON.parse(cfg.data || '{}');
        const newAcc = {
          id: Date.now(),
          friendly_name: body.friendly_name || "Nova Conta Twilio",
          twilio_account_sid: body.twilio_account_sid || "AC...",
          twilio_auth_token: body.twilio_auth_token || "...",
          twilio_phone_number: body.twilio_phone_number || "+1..."
        };
        const updated = [...twilioAccounts, newAcc];
        setStorageItem('mf_twilio_accounts', updated);
        return {
          data: newAcc,
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 14. PUT /api/twilio-accounts/:id
      const twilioEditMatch = pathname.match(/\/api\/twilio-accounts\/(\d+)$/);
      if (twilioEditMatch && method === 'PUT') {
        const idToEdit = parseInt(twilioEditMatch[1]);
        const body = JSON.parse(cfg.data || '{}');
        
        const updated = twilioAccounts.map(a => {
          if (a.id === idToEdit) {
            return {
              ...a,
              friendly_name: body.friendly_name || a.friendly_name,
              twilio_account_sid: body.twilio_account_sid || a.twilio_account_sid,
              twilio_phone_number: body.twilio_phone_number || a.twilio_phone_number,
              twilio_auth_token: body.twilio_auth_token !== '********' ? body.twilio_auth_token : a.twilio_auth_token
            };
          }
          return a;
        });
        setStorageItem('mf_twilio_accounts', updated);
        return {
          data: { success: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 15. DELETE /api/twilio-accounts/:id
      const twilioDeleteMatch = pathname.match(/\/api\/twilio-accounts\/(\d+)$/);
      if (twilioDeleteMatch && method === 'DELETE') {
        const idToDelete = parseInt(twilioDeleteMatch[1]);
        const updated = twilioAccounts.filter(a => a.id !== idToDelete);
        setStorageItem('mf_twilio_accounts', updated);
        return {
          data: { success: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 16. GET /api/twilio/templates
      if (pathname.endsWith('/api/twilio/templates') && method === 'GET') {
        return {
          data: initialTwilioTemplates,
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 17. GET /api/settings
      if (pathname.endsWith('/api/settings') && method === 'GET') {
        return {
          data: settings,
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // 18. POST /api/settings
      if (pathname.endsWith('/api/settings') && method === 'POST') {
        const body = JSON.parse(cfg.data || '{}');
        const updatedSettings = {
          messaging_provider: body.messaging_provider || "zapi",
          zapi_instance_id: body.zapi_instance_id || "",
          zapi_token: body.zapi_token || "",
          zapi_client_token: body.zapi_client_token || "",
          base_url: body.base_url || ""
        };
        setStorageItem('mf_settings', updatedSettings);
        return {
          data: updatedSettings,
          status: 200,
          statusText: "OK",
          headers: {},
          config: cfg
        };
      }
      
      // FALLBACK 404
      return {
        data: { message: "Mock endpoint not found" },
        status: 404,
        statusText: "Not Found",
        headers: {},
        config: cfg
      };
    };
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

console.log("🚀 [MassFlow] Layer de simulação offline ativado com sucesso!");
