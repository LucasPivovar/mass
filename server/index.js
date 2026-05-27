const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const { Queue, Worker } = require('bullmq');
require('dotenv').config();

// Setup Redis & BullMQ connection configuration
const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379
};

const campaignQueue = new Queue('campaign-sending', {
    connection: redisConnection
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Helper to get settings from DB
async function getSettings(userId) {
    let dbSettings = {};
    if (userId) {
        const [rows] = await pool.query('SELECT * FROM settings WHERE user_id = ?', [userId]);
        dbSettings = rows[0] || {};
    }
    let finalBaseUrl = dbSettings.base_url || process.env.BASE_URL || '';
    if (!finalBaseUrl || finalBaseUrl.includes('your-public-url.com')) {
        finalBaseUrl = 'https://ultracrm.online/api-disparos';
    }
    return {
        messagingProvider: dbSettings.messaging_provider || 'zapi',
        instanceId: dbSettings.zapi_instance_id || process.env.ZAPI_INSTANCE_ID,
        token: dbSettings.zapi_token || process.env.ZAPI_TOKEN,
        clientToken: dbSettings.zapi_client_token || process.env.ZAPI_CLIENT_TOKEN,
        twilioAccountSid: dbSettings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: dbSettings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: dbSettings.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER,
        baseUrl: finalBaseUrl
    };
}

// Helper to get Twilio Settings (either specific profile or fallback to global)
async function getTwilioSettings(userId, twilioAccountId) {
    const baseSettings = await getSettings(userId);
    
    if (twilioAccountId) {
        const [rows] = await pool.query(
            'SELECT * FROM twilio_accounts WHERE id = ? AND user_id = ?',
            [twilioAccountId, userId]
        );
        if (rows.length > 0) {
            const acc = rows[0];
            return {
                ...baseSettings,
                twilioAccountSid: acc.twilio_account_sid,
                twilioAuthToken: acc.twilio_auth_token,
                twilioPhoneNumber: acc.twilio_phone_number,
                friendlyName: acc.friendly_name
            };
        }
    }
    
    return baseSettings;
}

// Z-API Request helper
async function sendZapiMessage(settings, endpoint, payload) {
    if (!settings.instanceId || !settings.token || !settings.clientToken) {
        throw new Error('Z-API credentials not configured');
    }
    const url = `https://api.z-api.io/instances/${settings.instanceId}/token/${settings.token}/${endpoint}`;
    
    console.log('--- ENVIANDO REQUISIÇÃO Z-API ---');
    console.log(`URL: ${url}`);
    console.log(`Headers:`, { 'Client-Token': settings.clientToken, 'Content-Type': 'application/json' });
    console.log(`Payload:`, JSON.stringify(payload, null, 2));
    console.log('---------------------------------');

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'client-token': settings.clientToken,
                'Content-Type': 'application/json'
            }
        });
        console.log('--- RESPOSTA Z-API ---');
        console.log(response.data);
        console.log('----------------------');
        return response;
    } catch (error) {
        console.error('--- ERRO Z-API ---');
        console.error(error.response ? error.response.data : error.message);
        console.error('------------------');
        throw error;
    }
}

// Twilio Request helper
async function sendTwilioMessage(settings, toPhone, templateSid, templateVariables, mediaUrl) {
    if (!settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) {
        throw new Error('Twilio credentials not configured');
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${settings.twilioAccountSid}/Messages.json`;
    
    let formattedTo = toPhone;
    if (!formattedTo.startsWith('+')) {
        formattedTo = '+' + formattedTo;
    }

    let formattedFrom = settings.twilioPhoneNumber;
    if (!formattedFrom.startsWith('whatsapp:')) {
        if (!formattedFrom.startsWith('+')) {
            formattedFrom = '+' + formattedFrom;
        }
        formattedFrom = 'whatsapp:' + formattedFrom;
    }

    const params = new URLSearchParams();
    params.append('To', 'whatsapp:' + formattedTo);
    params.append('From', formattedFrom);
    params.append('ContentSid', templateSid);
    if (templateVariables && Object.keys(templateVariables).length > 0) {
        // Sanitize variables to prevent Twilio Error 21656 (replace newlines with Unicode Braille Blank U+2800 to force visual wrap)
        const sanitizedVariables = {};
        for (const [key, value] of Object.entries(templateVariables)) {
            if (typeof value === 'string') {
                // Unicode Braille Pattern Blank (U+2800) is invisible on screen but treated as a letter, bypassing Meta's whitespace limitations
                const invisibleWrap = '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀'; // 40 Braille Blanks
                sanitizedVariables[key] = value
                    .replace(/\r?\n/g, invisibleWrap)
                    .replace(/\t/g, ' ')
                    .replace(/\s{5,}/g, '    ');
            } else {
                sanitizedVariables[key] = value;
            }
        }
        params.append('ContentVariables', JSON.stringify(sanitizedVariables));
    }
    if (mediaUrl) {
        params.append('MediaUrl', mediaUrl);
    }
    
    if (settings.baseUrl) {
        params.append('StatusCallback', `${settings.baseUrl}/api/twilio/callback`);
    }

    console.log('--- ENVIANDO REQUISIÇÃO TWILIO ---');
    console.log(`URL: ${url}`);
    console.log(`[DEBUG] From: ${formattedFrom}`);
    console.log(`[DEBUG] To: whatsapp:${formattedTo}`);
    console.log(`[DEBUG] ContentSid: ${templateSid}`);
    console.log(`Payload:`, params.toString());
    console.log('---------------------------------');

    const authHeader = 'Basic ' + Buffer.from(`${settings.twilioAccountSid}:${settings.twilioAuthToken}`).toString('base64');

    try {
        const response = await axios.post(url, params.toString(), {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('--- RESPOSTA TWILIO ---');
        console.log(response.data);
        console.log('----------------------');
        return response;
    } catch (error) {
        console.error('--- ERRO TWILIO ---');
        console.error(error.response ? error.response.data : error.message);
        console.error('------------------');
        throw error;
    }
}

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied' });
    
    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// User Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }
    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Este usuário já está cadastrado.' });
        }

        const [userCountRows] = await pool.query('SELECT COUNT(*) as count FROM users');
        const isFirstUser = userCountRows[0].count === 0;

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        const newUserId = result.insertId;

        // Migração automática de dados órfãos se for o primeiro usuário
        if (isFirstUser) {
            console.log(`[Migration] Migrating orphan data to user_id: ${newUserId}`);
            await pool.query('UPDATE contacts SET user_id = ? WHERE user_id IS NULL', [newUserId]);
            await pool.query('UPDATE campaigns SET user_id = ? WHERE user_id IS NULL', [newUserId]);
            await pool.query('UPDATE settings SET user_id = ? WHERE user_id IS NULL', [newUserId]);
        }

        const token = jwt.sign({ id: newUserId, username }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Erro ao cadastrar usuário' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos' });
        }
        const user = rows[0];

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Erro ao realizar login' });
    }
});

// Helper to clean phone numbers and handle scientific notation from Excel
function cleanPhone(rawPhone) {
    if (!rawPhone) return '';
    let phoneStr = String(rawPhone).trim();
    
    if (/^\d+[.,]\d+[Ee][+-]?\d+$/.test(phoneStr)) {
        phoneStr = phoneStr.replace(',', '.');
        const num = Number(phoneStr);
        if (!isNaN(num)) {
            phoneStr = num.toLocaleString('fullwide', { useGrouping: false });
        }
    }
    
    return phoneStr.replace(/\D/g, '');
}

// Upload Spreadsheet
app.post('/api/upload', verifyToken, uploadMemory.single('file'), async (req, res) => {
    const { flag } = req.body;
    const file = req.file;
    const userId = req.user.id;

    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        let values = [];

        if (file.originalname && file.originalname.toLowerCase().endsWith('.csv')) {
            const text = file.buffer.toString('utf-8');
            const lines = text.split(/\r?\n/).filter(line => line.trim());
            if (lines.length <= 1) return res.status(400).json({ message: 'Empty sheet or missing data' });

            const firstLine = lines[0];
            const separator = firstLine.includes(';') ? ';' : ',';

            const header = lines.shift().split(separator).map(h => h.trim().toLowerCase());
            const nomeIdx = header.indexOf('nome');
            const telefoneIdx = header.indexOf('telefone');

            if (nomeIdx === -1 || telefoneIdx === -1) {
                return res.status(400).json({ message: 'Colunas "Nome" ou "Telefone" não encontradas.' });
            }

            values = lines.map(line => {
                const cols = line.split(separator);
                const nome = (cols[nomeIdx] || '').trim();
                const telefone = cleanPhone(cols[telefoneIdx]);
                return [nome, telefone, flag || 'default', userId];
            });
        } else {
            const workbook = xlsx.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            if (data.length === 0) return res.status(400).json({ message: 'Empty sheet' });

            values = data.map(row => {
                const keys = Object.keys(row);
                if (keys.length === 1 && keys[0].includes(';')) {
                    const parts = keys[0].split(';');
                    const vals = String(row[keys[0]]).split(';');
                    const nIdx = parts.findIndex(p => p.toLowerCase() === 'nome');
                    const tIdx = parts.findIndex(p => p.toLowerCase() === 'telefone');
                    return [
                        (vals[nIdx] || '').trim(),
                        cleanPhone(vals[tIdx]),
                        flag || 'default',
                        userId
                    ];
                }

                return [
                    (row.nome || row.Nome || '').toString().trim(),
                    cleanPhone(row.telefone || row.Telefone),
                    flag || 'default',
                    userId
                ];
            });
        }

        const query = 'INSERT INTO contacts (nome, telefone, flag, user_id) VALUES ?';
        await pool.query(query, [values]);

        res.json({ message: `${values.length} contatos salvos com sucesso sob o grupo: ${flag}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing spreadsheet' });
    }
});

// Get Contacts (with backend pagination, tag filtering, and search)
app.get('/api/contacts', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // If pagination parameters are not present and no tag/search is explicitly set for pagination,
        // fallback to returning all contacts in an array to ensure full backward compatibility.
        if (!req.query.page && !req.query.limit && req.query.paginate !== 'true') {
            const [rows] = await pool.query('SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            return res.json(rows);
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const flag = req.query.flag;
        const search = req.query.search;
        
        let query = 'SELECT * FROM contacts WHERE user_id = ?';
        let countQuery = 'SELECT COUNT(*) as total FROM contacts WHERE user_id = ?';
        const queryParams = [userId];
        const countParams = [userId];
        
        if (flag) {
            query += ' AND flag = ?';
            countQuery += ' AND flag = ?';
            queryParams.push(flag);
            countParams.push(flag);
        }
        
        if (search) {
            const searchPattern = `%${search}%`;
            query += ' AND (nome LIKE ? OR telefone LIKE ?)';
            countQuery += ' AND (nome LIKE ? OR telefone LIKE ?)';
            queryParams.push(searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern);
        }
        
        // Count total contacts matching the filters
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;
        
        // Add sorting and pagination
        query += ' ORDER BY created_at DESC';
        
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
        
        const [rows] = await pool.query(query, queryParams);
        
        res.json({
            contacts: rows,
            total,
            page,
            limit,
            totalPages: Math.max(Math.ceil(total / limit), 1)
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ message: 'Error fetching contacts' });
    }
});

// Get unique tags/flags for the current user
app.get('/api/contacts/tags', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT DISTINCT flag FROM contacts WHERE user_id = ? AND flag IS NOT NULL AND flag != "" ORDER BY flag ASC',
            [req.user.id]
        );
        const tags = rows.map(r => r.flag);
        res.json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ message: 'Error fetching tags' });
    }
});


// Delete Contact
app.delete('/api/contacts/:id', verifyToken, async (req, res) => {
    const contactId = req.params.id;
    const userId = req.user.id;
    try {
        const [contactCheck] = await pool.query('SELECT id FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
        if (contactCheck.length === 0) {
            return res.status(403).json({ message: 'Você não tem permissão para excluir este contato.' });
        }

        await pool.query('UPDATE campaign_messages SET contact_id = NULL WHERE contact_id = ?', [contactId]);
        
        const [result] = await pool.query('DELETE FROM contacts WHERE id = ? AND user_id = ?', [contactId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Contato não encontrado' });
        }
        res.json({ message: 'Contato excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ message: 'Erro ao excluir contato' });
    }
});

// Get Twilio Templates
app.get('/api/twilio/templates', verifyToken, async (req, res) => {
    try {
        const { twilioAccountId } = req.query;
        const settings = await getTwilioSettings(req.user.id, twilioAccountId);
        if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
            return res.status(400).json({ message: 'Credenciais da Twilio não configuradas para esta conta.' });
        }

        const authHeader = 'Basic ' + Buffer.from(`${settings.twilioAccountSid}:${settings.twilioAuthToken}`).toString('base64');
        const url = 'https://content.twilio.com/v1/Content';
        console.log(`[DEBUG] Buscando templates da Twilio para AccountSid: ${settings.twilioAccountSid}`);
        const response = await axios.get(url, {
            headers: {
                'Authorization': authHeader
            }
        });

        const templates = response.data.contents || [];
        console.log(`[DEBUG] Resposta dos templates obtidos da Twilio (${templates.length} encontrados):`);
        console.log(JSON.stringify(templates, null, 2));

        res.json(templates);
    } catch (error) {
        console.error('Error fetching Twilio templates:', error.response?.data || error.message);
        res.status(500).json({ message: 'Erro ao carregar templates da Twilio. Verifique suas credenciais.' });
    }
});

// Twilio Accounts CRUD Endpoints
app.get('/api/twilio-accounts', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, friendly_name, twilio_account_sid, twilio_phone_number, created_at FROM twilio_accounts WHERE user_id = ? ORDER BY created_at DESC', 
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching twilio accounts:', error);
        res.status(500).json({ message: 'Erro ao carregar contas Twilio' });
    }
});

app.post('/api/twilio-accounts', verifyToken, async (req, res) => {
    const { friendly_name, twilio_account_sid, twilio_auth_token, twilio_phone_number } = req.body;
    if (!friendly_name || !twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO twilio_accounts (user_id, friendly_name, twilio_account_sid, twilio_auth_token, twilio_phone_number) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, friendly_name, twilio_account_sid, twilio_auth_token, twilio_phone_number]
        );
        res.status(201).json({ id: result.insertId, message: 'Perfil do Twilio cadastrado com sucesso!' });
    } catch (error) {
        console.error('Error creating twilio account:', error);
        res.status(500).json({ message: 'Erro ao cadastrar perfil do Twilio' });
    }
});

app.put('/api/twilio-accounts/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { friendly_name, twilio_account_sid, twilio_auth_token, twilio_phone_number } = req.body;
    if (!friendly_name || !twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    try {
        let finalAuthToken = twilio_auth_token;
        if (twilio_auth_token === '********') {
            const [existing] = await pool.query('SELECT twilio_auth_token FROM twilio_accounts WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (existing.length > 0) {
                finalAuthToken = existing[0].twilio_auth_token;
            }
        }
        const [result] = await pool.query(
            'UPDATE twilio_accounts SET friendly_name = ?, twilio_account_sid = ?, twilio_auth_token = ?, twilio_phone_number = ? WHERE id = ? AND user_id = ?',
            [friendly_name, twilio_account_sid, finalAuthToken, twilio_phone_number, id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Perfil não encontrado ou não pertence a você' });
        }
        res.json({ message: 'Perfil do Twilio atualizado com sucesso!' });
    } catch (error) {
        console.error('Error updating twilio account:', error);
        res.status(500).json({ message: 'Erro ao atualizar perfil do Twilio' });
    }
});

app.delete('/api/twilio-accounts/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query(
            'DELETE FROM twilio_accounts WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Perfil não encontrado ou não pertence a você' });
        }
        res.json({ message: 'Perfil do Twilio excluído com sucesso!' });
    } catch (error) {
        console.error('Error deleting twilio account:', error);
        res.status(500).json({ message: 'Erro ao excluir perfil do Twilio' });
    }
});

// Campaign queue messaging is now managed robustly using BullMQ and Redis queues below.

// Create Campaign & Send Messages
app.post('/api/campaigns', verifyToken, upload.single('media'), async (req, res) => {
    const { name, messageText, contactIds, templateSid, templateVariables, provider, mediaUrl, twilioAccountId, selectionType, tag } = req.body;
    const mediaFile = req.file;
    const userId = req.user.id;

    if (!name) {
        return res.status(400).json({ message: 'Missing campaign name' });
    }

    const campaignProvider = provider || 'zapi';

    try {
        const settings = await getSettings(userId);
        
        let contacts = [];
        if (selectionType === 'all') {
            const [rows] = await pool.query('SELECT * FROM contacts WHERE user_id = ?', [userId]);
            contacts = rows;
        } else if (selectionType === 'tag' && tag) {
            const [rows] = await pool.query('SELECT * FROM contacts WHERE flag = ? AND user_id = ?', [tag, userId]);
            contacts = rows;
        } else {
            if (!contactIds) {
                return res.status(400).json({ message: 'Nenhum contato selecionado.' });
            }
            let parsedContactIds = [];
            try {
                parsedContactIds = typeof contactIds === 'string' ? JSON.parse(contactIds) : contactIds;
            } catch (e) {
                return res.status(400).json({ message: 'Invalid contactIds format' });
            }
            if (parsedContactIds.length === 0) {
                return res.status(400).json({ message: 'Nenhum contato selecionado.' });
            }
            const [rows] = await pool.query('SELECT * FROM contacts WHERE id IN (?) AND user_id = ?', [parsedContactIds, userId]);
            contacts = rows;
        }

        if (contacts.length === 0) {
            return res.status(400).json({ message: 'Nenhum contato encontrado com a seleção realizada.' });
        }

        // If provider is Twilio, we handle template campaigns
        if (campaignProvider === 'twilio') {
            if (!templateSid) {
                return res.status(400).json({ message: 'Selecione um template para a campanha Twilio.' });
            }

            let parsedVariables = {};
            if (templateVariables) {
                try {
                    parsedVariables = typeof templateVariables === 'string' ? JSON.parse(templateVariables) : templateVariables;
                } catch (e) {
                    return res.status(400).json({ message: 'Formato inválido de variáveis do template.' });
                }
            }

            // Save campaign in DB with provider flag and twilio_account_id
            const [result] = await pool.query(
                'INSERT INTO campaigns (name, template_sid, template_variables, media_path, provider, user_id, twilio_account_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, templateSid, JSON.stringify(parsedVariables), mediaUrl || null, 'twilio', userId, twilioAccountId || null]
            );
            const campaignId = result.insertId;

            // Bulk insert campaign messages in 'pending' state
            const messageValues = contacts.map(c => [campaignId, c.id, null, 'pending']);
            await pool.query(
                'INSERT INTO campaign_messages (campaign_id, contact_id, message_sid, status) VALUES ?',
                [messageValues]
            );

            // Construct BullMQ jobs
            const jobs = contacts.map(c => ({
                name: 'send-message',
                data: {
                    campaignId,
                    contactId: c.id,
                    contactName: c.nome,
                    contactPhone: c.telefone,
                    provider: 'twilio',
                    userId,
                    templateSid,
                    templateVariables: parsedVariables,
                    twilioAccountId,
                    mediaUrl: mediaUrl || null
                },
                opts: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 10000
                    }
                }
            }));

            // Add jobs in chunks of 1000 to prevent database payload limits
            const chunkSize = 1000;
            for (let i = 0; i < jobs.length; i += chunkSize) {
                await campaignQueue.addBulk(jobs.slice(i, i + chunkSize));
            }

            return res.json({ message: 'Campanha de disparos iniciada via fila BullMQ', campaignId });
        }

        // Z-API Flow (custom text message)
        const mediaPath = mediaFile ? `/uploads/${mediaFile.filename}` : null;
        const [result] = await pool.query(
            'INSERT INTO campaigns (name, message_text, media_path, provider, user_id) VALUES (?, ?, ?, ?, ?)', 
            [name, messageText || '', mediaPath, 'zapi', userId]
        );
        const campaignId = result.insertId;

        let endpoint = 'send-text';
        let zapiMediaUrl = null;

        if (mediaFile) {
            zapiMediaUrl = `${settings.baseUrl}${mediaPath}`;
            const mimetype = mediaFile.mimetype.toLowerCase();
            if (mimetype.startsWith('video/')) {
                endpoint = 'send-video';
            } else if (mimetype.startsWith('image/')) {
                endpoint = 'send-image';
            } else if (mimetype.startsWith('audio/')) {
                endpoint = 'send-audio';
            } else {
                endpoint = 'send-document'; 
            }
        }

        // Bulk insert campaign messages in 'pending' state
        const messageValues = contacts.map(c => [campaignId, c.id, null, 'pending']);
        await pool.query(
            'INSERT INTO campaign_messages (campaign_id, contact_id, message_sid, status) VALUES ?',
            [messageValues]
        );

        // Construct BullMQ jobs
        const jobs = contacts.map(c => ({
            name: 'send-message',
            data: {
                campaignId,
                contactId: c.id,
                contactName: c.nome,
                contactPhone: c.telefone,
                provider: 'zapi',
                userId,
                messageText: messageText || '',
                endpoint,
                zapiMediaUrl
            },
            opts: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 10000
                }
            }
        }));

        // Add jobs in chunks of 1000
        const chunkSize = 1000;
        for (let i = 0; i < jobs.length; i += chunkSize) {
            await campaignQueue.addBulk(jobs.slice(i, i + chunkSize));
        }

        return res.json({ message: 'Campanha de disparos iniciada via fila BullMQ', campaignId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating campaign' });
    }
});

// Resend Campaign
app.post('/api/campaigns/:id/resend', verifyToken, async (req, res) => {
    const originalCampaignId = req.params.id;
    const userId = req.user.id;

    try {
        const [campaignRows] = await pool.query('SELECT * FROM campaigns WHERE id = ? AND user_id = ?', [originalCampaignId, userId]);
        if (campaignRows.length === 0) {
            return res.status(404).json({ message: 'Campaign not found or access denied' });
        }
        const originalCampaign = campaignRows[0];

        const [messageRows] = await pool.query('SELECT DISTINCT contact_id FROM campaign_messages WHERE campaign_id = ? AND contact_id IS NOT NULL', [originalCampaignId]);
        if (messageRows.length === 0) {
            return res.status(400).json({ message: 'No valid contacts found for this campaign' });
        }
        const contactIds = messageRows.map(row => row.contact_id);

        const settings = await getSettings(userId);
        const [contacts] = await pool.query('SELECT * FROM contacts WHERE id IN (?) AND user_id = ?', [contactIds, userId]);

        if (originalCampaign.provider === 'twilio') {
            const newName = `${originalCampaign.name} (Reenvio)`;
            const templateVariables = originalCampaign.template_variables ? JSON.parse(originalCampaign.template_variables) : {};
            const mediaUrl = originalCampaign.media_path;
            const twilioAccountId = originalCampaign.twilio_account_id;

            const [result] = await pool.query(
                'INSERT INTO campaigns (name, template_sid, template_variables, media_path, provider, user_id, twilio_account_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [newName, originalCampaign.template_sid, originalCampaign.template_variables, mediaUrl || null, 'twilio', userId, twilioAccountId || null]
            );
            const newCampaignId = result.insertId;

            // Bulk insert campaign messages in 'pending' state
            const messageValues = contacts.map(c => [newCampaignId, c.id, null, 'pending']);
            await pool.query(
                'INSERT INTO campaign_messages (campaign_id, contact_id, message_sid, status) VALUES ?',
                [messageValues]
            );

            // Construct BullMQ jobs
            const jobs = contacts.map(c => ({
                name: 'send-message',
                data: {
                    campaignId: newCampaignId,
                    contactId: c.id,
                    contactName: c.nome,
                    contactPhone: c.telefone,
                    provider: 'twilio',
                    userId,
                    templateSid: originalCampaign.template_sid,
                    templateVariables,
                    twilioAccountId,
                    mediaUrl: mediaUrl || null
                },
                opts: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 10000
                    }
                }
            }));

            // Add jobs in chunks of 1000
            const chunkSize = 1000;
            for (let i = 0; i < jobs.length; i += chunkSize) {
                await campaignQueue.addBulk(jobs.slice(i, i + chunkSize));
            }

            return res.json({ message: 'Reenvio de campanha iniciado via fila BullMQ', campaignId: newCampaignId });
        }

        // Z-API Flow (custom text message)
        const newName = `${originalCampaign.name} (Reenvio)`;
        const [result] = await pool.query(
            'INSERT INTO campaigns (name, message_text, media_path, provider, user_id) VALUES (?, ?, ?, ?, ?)', 
            [newName, originalCampaign.message_text, originalCampaign.media_path, 'zapi', userId]
        );
        const newCampaignId = result.insertId;

        let endpoint = 'send-text';
        let zapiMediaUrl = null;

        if (originalCampaign.media_path) {
            zapiMediaUrl = `${settings.baseUrl}${originalCampaign.media_path}`;
            const ext = path.extname(originalCampaign.media_path).toLowerCase();
            if (['.mp4', '.avi', '.mov'].includes(ext)) {
                endpoint = 'send-video';
            } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                endpoint = 'send-image';
            } else if (['.mp3', '.ogg', '.wav'].includes(ext)) {
                endpoint = 'send-audio';
            } else {
                endpoint = 'send-document'; 
            }
        }

        // Bulk insert campaign messages in 'pending' state
        const messageValues = contacts.map(c => [newCampaignId, c.id, null, 'pending']);
        await pool.query(
            'INSERT INTO campaign_messages (campaign_id, contact_id, message_sid, status) VALUES ?',
            [messageValues]
        );

        // Construct BullMQ jobs
        const jobs = contacts.map(c => ({
            name: 'send-message',
            data: {
                campaignId: newCampaignId,
                contactId: c.id,
                contactName: c.nome,
                contactPhone: c.telefone,
                provider: 'zapi',
                userId,
                messageText: originalCampaign.message_text || '',
                endpoint,
                zapiMediaUrl
            },
            opts: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 10000
                }
            }
        }));

        // Add jobs in chunks of 1000
        const chunkSize = 1000;
        for (let i = 0; i < jobs.length; i += chunkSize) {
            await campaignQueue.addBulk(jobs.slice(i, i + chunkSize));
        }

        return res.json({ message: 'Reenvio de campanha iniciado via fila BullMQ', campaignId: newCampaignId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error resending campaign' });
    }
});

// Z-API Status Callback
app.post('/api/zapi/callback', async (req, res) => {
    const { type, messageId, status } = req.body;
    
    if (type !== 'MessageStatusCallback' || !messageId) {
        return res.sendStatus(200);
    }

    let internalStatus = status.toLowerCase();

    try {
        await pool.query('UPDATE campaign_messages SET status = ? WHERE message_sid = ?', [internalStatus, messageId]);
        res.sendStatus(200);
    } catch (error) {
        console.error('Callback error:', error);
        res.sendStatus(500);
    }
});

// Twilio Status Callback
app.post('/api/twilio/callback', async (req, res) => {
    const { MessageSid, MessageStatus } = req.body;
    
    if (!MessageSid) {
        return res.sendStatus(200);
    }

    let internalStatus = 'queued';
    if (MessageStatus === 'delivered' || MessageStatus === 'sent') {
        internalStatus = 'delivered';
    } else if (MessageStatus === 'read') {
        internalStatus = 'read';
    } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
        internalStatus = 'failed';
    }

    try {
        await pool.query('UPDATE campaign_messages SET status = ? WHERE message_sid = ?', [internalStatus, MessageSid]);
        res.sendStatus(200);
    } catch (error) {
        console.error('Twilio Callback error:', error);
        res.sendStatus(500);
    }
});

// List Campaigns with Metrics
app.get('/api/campaigns', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                c.id, 
                c.name, 
                c.message_text,
                c.media_path,
                c.template_sid,
                c.template_variables,
                c.provider,
                c.created_at,
                c.twilio_account_id,
                MAX(ta.friendly_name) as twilio_account_name,
                COUNT(cm.id) as total_sent,
                SUM(CASE WHEN cm.status IN ('delivered', 'read') THEN 1 ELSE 0 END) as total_delivered,
                SUM(CASE WHEN cm.status = 'read' THEN 1 ELSE 0 END) as total_read
            FROM campaigns c
            LEFT JOIN campaign_messages cm ON c.id = cm.campaign_id
            LEFT JOIN twilio_accounts ta ON c.twilio_account_id = ta.id
            WHERE c.user_id = ?
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `;
        const [rows] = await pool.query(query, [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: 'Error fetching campaigns' });
    }
});

// Get Settings
app.get('/api/settings', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings WHERE user_id = ?', [req.user.id]);
        res.json(rows[0] || {});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// Update Settings
app.post('/api/settings', verifyToken, async (req, res) => {
    const { 
        messaging_provider,
        zapi_instance_id, 
        zapi_token, 
        zapi_client_token, 
        twilio_account_sid,
        twilio_auth_token,
        twilio_phone_number,
        base_url 
    } = req.body;
    const userId = req.user.id;
    try {
        await pool.query(
            `INSERT INTO settings (user_id, messaging_provider, zapi_instance_id, zapi_token, zapi_client_token, twilio_account_sid, twilio_auth_token, twilio_phone_number, base_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
                messaging_provider = ?, 
                zapi_instance_id = ?, 
                zapi_token = ?, 
                zapi_client_token = ?, 
                twilio_account_sid = ?, 
                twilio_auth_token = ?, 
                twilio_phone_number = ?, 
                base_url = ?`,
            [
                userId, messaging_provider || 'zapi', zapi_instance_id, zapi_token, zapi_client_token, twilio_account_sid, twilio_auth_token, twilio_phone_number, base_url,
                messaging_provider || 'zapi', zapi_instance_id, zapi_token, zapi_client_token, twilio_account_sid, twilio_auth_token, twilio_phone_number, base_url
            ]
        );
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// BullMQ Worker to process campaign messages sequentially with rate limiting
const campaignWorker = new Worker('campaign-sending', async (job) => {
    const { campaignId, contactId, contactName, contactPhone, provider, templateSid, templateVariables, twilioAccountId, mediaUrl, messageText, endpoint, zapiMediaUrl, userId } = job.data;
    
    // Fetch fresh settings for the user
    const settings = await getSettings(userId);
    
    try {
        if (provider === 'twilio') {
            const twilioSettings = await getTwilioSettings(userId, twilioAccountId);
            
            const personalizedVars = {};
            for (const [key, val] of Object.entries(templateVariables || {})) {
                personalizedVars[key] = String(val).replace(/{{nome}}/g, contactName);
            }
            
            const response = await sendTwilioMessage(twilioSettings, contactPhone, templateSid, personalizedVars, mediaUrl);
            const messageSid = response.data.sid;
            
            await pool.query(
                'UPDATE campaign_messages SET message_sid = ?, status = ? WHERE campaign_id = ? AND contact_id = ?',
                [messageSid || null, 'queued', campaignId, contactId]
            );
        } else {
            let personalizedMessage = messageText || '';
            if (personalizedMessage) {
                personalizedMessage = personalizedMessage.replace(/{{nome}}/g, contactName);
            }
            
            let payload = {
                phone: contactPhone
            };
            
            if (endpoint === 'send-text') {
                payload.message = personalizedMessage;
            } else if (endpoint === 'send-image') {
                payload.image = zapiMediaUrl;
                if (personalizedMessage) payload.caption = personalizedMessage;
            } else if (endpoint === 'send-video') {
                payload.video = zapiMediaUrl;
                if (personalizedMessage) payload.caption = personalizedMessage;
            } else if (endpoint === 'send-audio') {
                payload.audio = zapiMediaUrl;
            } else {
                payload.document = zapiMediaUrl;
            }
            
            const response = await sendZapiMessage(settings, endpoint, payload);
            const messageId = response.data.messageId;
            
            await pool.query(
                'UPDATE campaign_messages SET message_sid = ?, status = ? WHERE campaign_id = ? AND contact_id = ?',
                [messageId || null, 'queued', campaignId, contactId]
            );
        }
    } catch (err) {
        console.error(`[Worker Error] Failed to send job ${job.id} to ${contactPhone}:`, err.response?.data || err.message);
        // Mark database record as failed
        await pool.query(
            'UPDATE campaign_messages SET status = ? WHERE campaign_id = ? AND contact_id = ?',
            ['failed', campaignId, contactId]
        );
        throw err; // Escalate to BullMQ retry logic
    }
}, {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
        max: 10,
        duration: 1000 // 10 requests per second maximum
    }
});

campaignWorker.on('completed', (job) => {
    console.log(`[Queue Success] Job ${job.id} for campaign ${job.data.campaignId} completed.`);
});

campaignWorker.on('failed', (job, err) => {
    console.error(`[Queue Failure] Job ${job?.id} failed:`, err.message);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
