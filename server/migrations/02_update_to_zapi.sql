-- Remover campos antigos da Twilio
ALTER TABLE settings 
DROP COLUMN twilio_sid, 
DROP COLUMN twilio_token, 
DROP COLUMN twilio_number;

-- Adicionar novos campos da Z-API na tabela de configurações
ALTER TABLE settings 
ADD COLUMN zapi_instance_id VARCHAR(255),
ADD COLUMN zapi_token VARCHAR(255),
ADD COLUMN zapi_client_token VARCHAR(255);

-- Adicionar suporte a mídia e texto personalizado nas campanhas
ALTER TABLE campaigns 
ADD COLUMN message_text TEXT,
ADD COLUMN media_path VARCHAR(500);

-- Se a tabela campaign_messages já existir, precisamos garantir que o message_sid acomode IDs mais longos da Z-API, caso a Z-API os utilize.
-- O message_sid original tem VARCHAR(100), o que deve ser suficiente, mas caso contrário poderíamos expandir.
