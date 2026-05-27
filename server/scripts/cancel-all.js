const { Queue } = require('bullmq');
const pool = require('../db');
require('dotenv').config();

const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379
};

async function main() {
    console.log('Iniciando limpeza da fila e cancelamento de mensagens...');
    
    // 1. Limpar a fila do BullMQ
    try {
        const campaignQueue = new Queue('campaign-sending', {
            connection: redisConnection
        });

        console.log('Drenando a fila de disparos (removendo mensagens aguardando)...');
        // drain(true) remove todos os jobs que estão em espera/aguardando
        await campaignQueue.drain();
        
        console.log('Limpando outros estados da fila...');
        await campaignQueue.clean(0, 0, 'wait');
        await campaignQueue.clean(0, 0, 'delayed');
        await campaignQueue.clean(0, 0, 'paused');
        await campaignQueue.clean(0, 0, 'completed');
        await campaignQueue.clean(0, 0, 'failed');

        await campaignQueue.close();
        console.log('✅ Fila BullMQ limpa com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao limpar fila BullMQ:', error.message);
    }

    // 2. Atualizar o banco de dados
    try {
        console.log('Atualizando status das mensagens pendentes no banco de dados para "cancelled"...');
        const [result] = await pool.query(
            "UPDATE campaign_messages SET status = 'cancelled' WHERE status IN ('pending', 'queued')"
        );
        console.log(`✅ Banco de dados atualizado! ${result.affectedRows} mensagens foram marcadas como canceladas.`);
    } catch (error) {
        console.error('❌ Erro ao atualizar banco de dados:', error.message);
    }

    // Fechar pool de conexão
    await pool.end();
    console.log('Processo finalizado.');
}

main().catch(console.error);
