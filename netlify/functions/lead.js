const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID || '8c857ad94d014c50a814039ad17fc572';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { nombre, email, telefono, servicio, mensaje } = body;

  if (!nombre || !email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Nombre y email son requeridos.' })
    };
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        'Nombre':    { title: [{ text: { content: nombre } }] },
        'Email':     { email },
        'Teléfono':  { phone_number: telefono || '' },
        'Servicio':  { select: servicio ? { name: servicio } : null },
        'Mensaje':   { rich_text: [{ text: { content: mensaje || '' } }] },
        'Estado':    { select: { name: 'New Lead' } },
        'Fuente':    { select: { name: 'Website' } }
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: page.id })
    };

  } catch (err) {
    console.error('Notion error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No se pudo guardar el lead.' })
    };
  }
};
