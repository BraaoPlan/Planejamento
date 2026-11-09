/**
 * Utilitário de Migração de Dados: SQLite (qualimed.sqlite) -> Firebase Cloud Firestore
 * Região Alvo do Firestore: southamerica-east1 (São Paulo, Brasil)
 * 
 * Uso:
 * 1. Exportação para JSON:
 *    node scripts/export_sqlite_to_firebase.js
 * 
 * 2. Upload direto com Chave de Serviço do Firebase:
 *    Coloque seu arquivo 'serviceAccountKey.json' na raiz do projeto e execute:
 *    node scripts/export_sqlite_to_firebase.js --upload
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const NETWORK_DB_PATH = 'Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/qualimed.sqlite';
let DB_PATH = path.join(__dirname, '..', 'qualimed.sqlite');

if (fs.existsSync(NETWORK_DB_PATH)) {
  console.log(`[MIGRAÇÃO] Conectando ao banco de dados oficial na REDE: ${NETWORK_DB_PATH}`);
  DB_PATH = NETWORK_DB_PATH;
} else if (fs.existsSync(DB_PATH)) {
  console.log(`[MIGRAÇÃO] Conectando ao banco de dados LOCAL: ${DB_PATH}`);
} else {
  console.error('[ERRO] Nenhum banco de dados qualimed.sqlite encontrado!');
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);

// 1. Extração dos registros
console.log('--- Extraindo dados das tabelas SQLite ---');

const atividades = db.prepare('SELECT * FROM atividades').all();
const setores = db.prepare('SELECT * FROM setores').all();
const diagnosticos = db.prepare('SELECT * FROM diagnosticos').all();
const planos5w2h = db.prepare('SELECT * FROM planos_5w2h').all();
const usuarios = db.prepare('SELECT id, nome, perfil, pin, ativo FROM usuarios').all();

console.log(`- Atividades encontradas: ${atividades.length}`);
console.log(`- Setores cadastrados: ${setores.length}`);
console.log(`- Diagnósticos/Criticidade: ${diagnosticos.length}`);
console.log(`- Planos de Ação 5W2H: ${planos5w2h.length}`);
console.log(`- Usuários/Analistas: ${usuarios.length}`);

// Montagem do payload completo
const exportData = {
  version: '2.0-FIREBASE',
  exportedAt: new Date().toISOString(),
  region: 'southamerica-east1 (São Paulo)',
  collections: {
    atividades,
    setores,
    diagnosticos,
    planos_5w2h: planos5w2h,
    usuarios
  }
};

const outputDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const seedPath = path.join(outputDir, 'firebase_seed.json');
fs.writeFileSync(seedPath, JSON.stringify(exportData, null, 2), 'utf8');
console.log(`\n[SUCESSO] Arquivo de semente gerado em: ${seedPath}`);

// 2. Upload automático se a flag --upload for passada e houver serviceAccountKey.json
async function tryDirectUpload() {
  const serviceKeyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (!fs.existsSync(serviceKeyPath)) {
    console.log('\n--- UPLOAD DIRETO PARA O FIREBASE ---');
    console.log('Para fazer o upload automático direto via terminal:');
    console.log('1. Acesse o Console do Firebase (https://console.firebase.google.com)');
    console.log('2. Vá em Configurações do Projeto > Contas de Serviço (Service Accounts)');
    console.log('3. Clique em "Gerar nova chave privada" e salve como "serviceAccountKey.json" na raiz do projeto');
    console.log('4. Execute: node scripts/export_sqlite_to_firebase.js --upload\n');
    return;
  }

  console.log('\n[FIREBASE ADMIN] Chave de serviço detectada! Iniciando upload para o Firestore...');
  try {
    const admin = require('firebase-admin');
    const serviceAccount = require(serviceKeyPath);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const firestore = admin.firestore();
    firestore.settings({ ignoreUndefinedProperties: true });

    // Upload das atividades
    console.log(`-> Fazendo upload de ${atividades.length} atividades...`);
    for (const a of atividades) {
      await firestore.collection('atividades').doc(String(a.id)).set(a, { merge: true });
    }

    // Upload dos setores
    console.log(`-> Fazendo upload de ${setores.length} setores...`);
    for (const s of setores) {
      await firestore.collection('setores').doc(String(s.id)).set(s, { merge: true });
    }

    // Upload dos diagnósticos
    console.log(`-> Fazendo upload de ${diagnosticos.length} diagnósticos...`);
    for (const d of diagnosticos) {
      await firestore.collection('diagnosticos').doc(String(d.id)).set(d, { merge: true });
    }

    // Upload dos planos 5W2H
    console.log(`-> Fazendo upload de ${planos5w2h.length} planos 5W2H...`);
    for (const p of planos5w2h) {
      await firestore.collection('planos_5w2h').doc(String(p.id)).set(p, { merge: true });
    }

    // Upload dos usuários
    console.log(`-> Fazendo upload de ${usuarios.length} usuários...`);
    for (const u of usuarios) {
      await firestore.collection('usuarios').doc(String(u.id)).set(u, { merge: true });
    }

    console.log('\n[PARABÉNS] Todos os dados foram migrados com sucesso para o Cloud Firestore (São Paulo)!');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('Nota: O pacote firebase-admin não está instalado localmente.');
      console.log('Instale executando: npm install firebase-admin');
    } else {
      console.error('[ERRO NO UPLOAD]', err);
    }
  }
}

if (process.argv.includes('--upload')) {
  tryDirectUpload();
} else {
  console.log('\n[DICA] Para subir diretamente para o Firestore agora mesmo, adicione a flag --upload.');
}
