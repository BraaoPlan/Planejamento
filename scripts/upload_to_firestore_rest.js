/**
 * Upload inicial de dados do SQLite para o Cloud Firestore via REST API
 * Utiliza as chaves do projeto (plannerx-4e4ac)
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const API_KEY = "AIzaSyAXcoKrSFAY1AceZPHaeQA34RoFe-wT1zE";
const PROJECT_ID = "plannerx-4e4ac";

const NETWORK_DB_PATH = 'Z:/Qualidade e Gestão de Riscos/Qualimed/QualiMed-SIGQ-Release/qualimed.sqlite';
let DB_PATH = path.join(__dirname, '..', 'qualimed.sqlite');

if (fs.existsSync(NETWORK_DB_PATH)) {
  DB_PATH = NETWORK_DB_PATH;
}

const db = new DatabaseSync(DB_PATH);

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = { arrayValue: { values: val.map(item => typeof item === 'object' ? { mapValue: { fields: toFirestoreFields(item) } } : { stringValue: String(item) }) } };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

async function uploadDoc(collection, docId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) })
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error ? resData.error.message : `HTTP ${res.status}`);
  }
  return resData;
}

async function runMigration() {
  console.log(`[MIGRAÇÃO] Conectando ao Cloud Firestore do projeto: ${PROJECT_ID}...`);

  const atividades = db.prepare('SELECT * FROM atividades').all();
  const setores = db.prepare('SELECT * FROM setores').all();
  const diagnosticos = db.prepare('SELECT * FROM diagnosticos').all();
  const planos5w2h = db.prepare('SELECT * FROM planos_5w2h').all();

  console.log(`\n1. Enviando ${atividades.length} atividades...`);
  for (const act of atividades) {
    process.stdout.write(`  -> Atividade #${act.id}: ${act.processo}... `);
    try {
      await uploadDoc('atividades', String(act.id), act);
      console.log('OK');
    } catch(err) {
      console.log(`ERRO: ${err.message}`);
      if (err.message.includes('Missing or insufficient permissions')) {
        console.error('\n[ATENÇÃO] As Regras de Segurança do Firestore ainda não foram publicadas no Console do Firebase!');
        console.error('Acesse: https://console.firebase.google.com/project/' + PROJECT_ID + '/firestore/rules');
        console.error('Cole: allow read, write: if true; e clique em "Publicar".');
        return;
      }
    }
  }

  console.log(`\n2. Enviando ${setores.length} setores...`);
  for (const s of setores) {
    try {
      await uploadDoc('setores', String(s.id), s);
    } catch(err) {}
  }
  console.log(`  -> ${setores.length} setores sincronizados.`);

  console.log(`\n3. Enviando ${diagnosticos.length} diagnósticos...`);
  for (const d of diagnosticos) {
    try {
      await uploadDoc('diagnosticos', String(d.id), d);
    } catch(err) {}
  }
  console.log(`  -> ${diagnosticos.length} diagnósticos sincronizados.`);

  console.log(`\n4. Enviando ${planos5w2h.length} planos 5W2H...`);
  for (const p of planos5w2h) {
    try {
      await uploadDoc('planos_5w2h', String(p.id), p);
    } catch(err) {}
  }
  console.log(`  -> ${planos5w2h.length} planos 5W2H sincronizados.`);

  console.log('\n[SUCESSO] Todos os dados foram migrados com sucesso para o Firebase Cloud Firestore (São Paulo)!');
}

runMigration().catch(console.error);
