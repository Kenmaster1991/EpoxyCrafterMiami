require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = process.env.PORT || 3001;

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID || '8c857ad94d014c50a814039ad17fc572';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: DATABASE_ID });
});

// Recibir lead del formulario
app.post('/api/lead', async (req, res) => {
  const { nombre, email, telefono, servicio, mensaje } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos.' });
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        'Nombre': {
          title: [{ text: { content: nombre } }]
        },
        'Email': {
          email: email
        },
        'Teléfono': {
          phone_number: telefono || ''
        },
        'Servicio': {
          select: servicio ? { name: servicio } : null
        },
        'Mensaje': {
          rich_text: [{ text: { content: mensaje || '' } }]
        },
        'Estado': {
          select: { name: 'New Lead' }
        },
        'Fuente': {
          select: { name: 'Website' }
        }
      }
    });

    console.log(`✅ Nuevo lead guardado: ${nombre} (${email}) — Notion ID: ${page.id}`);
    res.json({ success: true, id: page.id });

  } catch (err) {
    console.error('❌ Error guardando en Notion:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el lead. Intenta de nuevo.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Capital Crafter backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Notion DB: ${DATABASE_ID}`);
});
