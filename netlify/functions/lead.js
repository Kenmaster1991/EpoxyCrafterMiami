const { Client } = require('@notionhq/client');
const { Resend } = require('resend');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const resend = new Resend(process.env.RESEND_API_KEY);
const DATABASE_ID = process.env.NOTION_DATABASE_ID || '8c857ad94d014c50a814039ad17fc572';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { nombre, email, telefono, servicio, mensaje } = body;

  if (!nombre || !email) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Nombre y email son requeridos.' })
    };
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        'Nombre':    { title: [{ text: { content: nombre } }] },
        'Email':     { email },
        'Teléfono':  { phone_number: telefono || null },
        'Servicio':  { select: servicio ? { name: servicio } : null },
        'Mensaje':   { rich_text: [{ text: { content: mensaje || '' } }] },
        'Estado':    { select: { name: 'New Lead' } },
        'Fuente':    { select: { name: 'Website' } }
      }
    });

    await resend.emails.send({
      from: 'EpoxyCrafter Miami <leads@epoxycraftermiami.com>',
      to: 'kcristia@epoxycraftermiami.com',
      subject: `🆕 Nuevo Lead: ${nombre} — ${servicio || 'Sin servicio'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 8px;">
          <div style="background: #C9A84C; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 22px;">✦ Nuevo Lead — EpoxyCrafter Miami</h1>
          </div>
          <div style="background: #fff; padding: 30px; border-radius: 0 0 6px 6px; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 8px; font-weight: bold; color: #666; width: 130px;">Nombre</td>
                <td style="padding: 12px 8px; color: #111;">${nombre}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 8px; font-weight: bold; color: #666;">Email</td>
                <td style="padding: 12px 8px;"><a href="mailto:${email}" style="color: #C9A84C;">${email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 8px; font-weight: bold; color: #666;">Teléfono</td>
                <td style="padding: 12px 8px;"><a href="tel:${telefono || ''}" style="color: #C9A84C;">${telefono || 'No proporcionado'}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 12px 8px; font-weight: bold; color: #666;">Servicio</td>
                <td style="padding: 12px 8px;">${servicio || 'No especificado'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 8px; font-weight: bold; color: #666; vertical-align: top;">Mensaje</td>
                <td style="padding: 12px 8px; color: #111;">${mensaje || 'Sin mensaje'}</td>
              </tr>
            </table>
            <div style="margin-top: 25px; text-align: center;">
              <a href="mailto:${email}" style="background: #C9A84C; color: #000; padding: 12px 28px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 14px;">Responder al cliente</a>
            </div>
          </div>
          <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 15px;">EpoxyCrafter Miami · epoxycraftermiami.com</p>
        </div>
      `
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, id: page.id })
    };

  } catch (err) {
    console.error('Error:', err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'No se pudo guardar el lead.' })
    };
  }
};
