require('dotenv').config();
const express = require('express');
const path = require('path');
const { google } = require('googleapis');

const app = express();
app.use(express.json());

// ---------- 1️⃣ Serve static files (your website) ----------
app.use(express.static(__dirname));

// ---------- 2️⃣ API route to receive form submissions securely ----------
app.post('/api/submit', async (req, res) => {
  try {
    const {
      Timestamp,
      LeadID,
      FullName,
      WhatsAppNumber,
      PreferredConsultationDate,
      PreferredConsultationTime,
      TreatmentCategory,
      TreatmentNeeded,
      ReportFileURL,
      Location,
      Language,
      LeadSource,
      Status
    } = req.body;

    // Validate essential fields
    if (!FullName || !WhatsAppNumber) {
      return res.status(400).json({ success: false, error: 'Full Name and WhatsApp Number are required.' });
    }

    // Verify environment variables are present
    if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error('GOOGLE_CREDENTIALS environment variable is not defined in your .env file.');
    }
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not defined in your .env file.');
    }

    // Authenticate using the credentials JSON
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Append the row to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: 'Sheet1!A:M',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          Timestamp || new Date().toISOString(),
          LeadID || '',
          FullName || '',
          WhatsAppNumber || '',
          PreferredConsultationDate || '',
          PreferredConsultationTime || '',
          TreatmentCategory || '',
          TreatmentNeeded || '',
          ReportFileURL || '',
          Location || '',
          Language || '',
          LeadSource || '',
          Status || 'New Lead'
        ]],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API submit error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ---------- 3️⃣ Start local server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 Local Node.js server running securely at http://localhost:${PORT}`);
});
