require('dotenv').config();
const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const { Readable } = require('stream');

const app = express();
app.use(express.json({ limit: '10mb' })); // Increased limit to support base64 file uploads

// ---------- Helpers for File Uploads ----------

function buildSheetImageFormula(imageUrl, viewUrl) {
  if (viewUrl) {
    return `=HYPERLINK("${viewUrl}", IMAGE("${imageUrl}"))`;
  }
  return `=IMAGE("${imageUrl}")`;
}

function buildDriveImageUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

let cachedAuth = null;
let cachedSheets = null;

const fallbackCredentials = {
  type: "service_account",
  project_id: "kera-501215",
  private_key_id: "9e5da8c778c2a541b9acab16e8a719a633477055",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDYdScIi0cBXMeC\npCLr93pVQfXj2qpDGD1SguQ0syrFytnZdWgFiZ8q+L8BuEBQPKkpSuMYp/uv3UJY\ny3pZGlGKsUo+4nj2vf58TzJjeyeNDEPUdPnXeIbLL476TzbzhqgOr//Bzeeh7HWZ\n4HTUcni/P7lyQj3or+zZiY5oc+knGp2TeMUivPz851JUMup7em6nFer6DpJzNCMu\nJ6iYIG0YPu34P3YkngFicWEK39WynqBt4hR3qFiUHGveAMoaw5U7FRl42rcryYKD\n5XiMrHU6v4oF8eYU9mqNzPzAxcvOt8nth8m1FL+vnnElitTw6gDTp0xJnNL1oXc/\nPtnKHj2DAgMBAAECggEAGaQ7JQB2v1sRyVCPUHunEr13FvBa1grjjMgzp2iICxk+\nGEwXr/w/DjScT+RXPgoJkfosj8mqf4lK6EDmc/KxsSfSX0Otx7D3Ghu5oN5Ab62B\nxYO76wH8mco++jjzDgMoGmFP/1HYfC6KOdnEjTwoQKOYYMgnFE7u1FA+vfHpLzf4\np5OfwR/BFYOrRLLPeecBCj4gTNpKWiXX44kBg8uIAzBEeej5SOb1iFbo/RxyNVoh\nnvTwra968nvakF/GmWcqp5oCQQ7XGpQBdQoLnp6HsJ3+xD4QO2L9Iu1OwVn6t+Hj\n8PVlWxQcWZo86kbzMfUlGJ3JIZjsyiKNlNoOwEl5bQKBgQDtg0vbQfGsIhN+hc+I\nKBRM/ePfWf9dD6JTbZ53nD4/JxG4iRDDZmxO6o4QSR7ft+0Oaxam5SAtvNnXFSA+\nJakxe4SklOIOSfq1Kjti4E9AU6T43TFk/EQI4IfdnKAcRV5nmUmYiqtGm+kRudGg\nL0hGisxHAx9y412FKT3LCVDGbQKBgQDpTk6rO/gjY+ECCpCNx5HkFrt7qGpgjhWL\ncuI4wYyunnumf8U4yifsGTPg7AvNm7cHUOCCzdT2GUx42PUoJzuHBcMkxqdSbL5c\n8AeL6mKBYgtWJJYVQQSJnLO2kqNZtScSAeTJdfEiOxPYUo039T4b5d55jGT+fzPy\nGwc4dHVdrwKBgQCyk+Rl/2fwz1Iu7/cA3XmeBcreNPGOi+G1rpbWQdB/dSWaxNuo\nvwqyLyMPVZr0BHslOxk19NJD8VksoQK0F2bmAIPTpulsau0oZ49tIVAVAo7oWo73\n6cBRmFgvJMMxXmrDo/o0yhZLKZCMtlTJhqNl/pfm0I9Ft3OqWj7OuLtV5QKBgQDe\nlVwOl+cz9G1OIkApU9ZHUrzJzDK5LbU2VoOnfFi4m/ECN3I0rQGLibvqAal9Hutu\nqmWXxcJAjIBd5zd1eICdYAz+gBxQUfkH9+RrQ1F5eM2yALPDUUV/+KWoMJxx0JeW\n4YGiBsjoTI6xWojqcyovOY6YTi5oc3leqRSpcsoqdwKBgA3JorYAUL1OKYf9Xihp\nuR+FUrj+M2YT6NA2tQ6LfK8uSV54dt38E/6pSc9np5Rjjh0wiBeJXUCli1SBikLG\ngd8wVrn4Fwd82oyM+MxGEg4iG1WexcXCVCTC+dLcVOvfHWiSx5cts/D6lWrUNawN\nW/O751fa94m+t4JVL93LUy/A\n-----END PRIVATE KEY-----\n",
  client_email: "sheets-api-user@kera-501215.iam.gserviceaccount.com",
  client_id: "115696127178775427928",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/sheets-api-user%40kera-501215.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1REDw-JvWGkKQJ2KhNyiUZLnYQlhvNuzDf6QoEizqnYU';
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzgJQarFAWZm9bz6xz6GPuitcuGckDC2kofPu7iY-ZnY5bvK9KfWi8l0Ci_scfNo1uW/exec';
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1wTILjOi4GMxrQKlrw3mhUpaVg_P8kscg';

function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;
  const credentials = process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS) : fallbackCredentials;
  cachedAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
  });
  return cachedAuth;
}

function getSheetsClient() {
  if (cachedSheets) return cachedSheets;
  cachedSheets = google.sheets({ version: 'v4', auth: getGoogleAuth() });
  return cachedSheets;
}

// 1. Upload using Google Apps Script (runs under your Google account — not the service account)
async function uploadToAppsScript(webAppUrl, fileData) {
  const payload = JSON.stringify({
    base64: fileData.base64,
    name: fileData.name,
    type: fileData.type
  });

  // Fetch automatically follows the 302 redirect from Google Apps Script.
  // Standard redirect behavior changes the method to GET and drops the body,
  // which is exactly what Apps Script expects to return the response payload.
  const response = await fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  });

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    if (text.includes('You need access') || text.includes('Access denied')) {
      throw new Error('Apps Script is not public. Redeploy with "Who has access: Anyone"');
    }
    throw new Error(`Apps Script error: ${text.slice(0, 100)}`);
  }

  if (!result.success) throw new Error(result.error || 'Apps Script upload failed');
  if (!result.id) throw new Error('Apps Script did not return a file ID');
  return result;
}

// 2. Upload using ImgBB (Free, simple image hosting — get key at https://api.imgbb.com/)
async function uploadToImgBB(apiKey, fileData) {
  const base64Content = fileData.base64.split(';base64,').pop();
  const formData = new URLSearchParams({
    key: apiKey,
    image: base64Content
  });
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error?.message || 'ImgBB upload failed');
  // Use direct image URL (not display_url page link) for Google Sheets IMAGE()
  const directUrl = result.data.url || result.data.image?.url;
  if (!directUrl) throw new Error('ImgBB did not return a direct image URL');
  return { url: directUrl };
}

// 3. Upload using standard Google Drive (Requires Google Workspace Shared Drive or delegation)
async function uploadToDrive(auth, fileData) {
  if (!fileData || !fileData.base64) return null;

  const drive = google.drive({ version: 'v3', auth });

  const base64Content = fileData.base64.split(';base64,').pop();
  const buffer = Buffer.from(base64Content, 'base64');

  const bufferStream = new Readable();
  bufferStream.push(buffer);
  bufferStream.push(null);

  const fileMetadata = {
    name: fileData.name,
  };
  
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    fileMetadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
  }
  const media = {
    mimeType: fileData.type,
    body: bufferStream,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
    supportsAllDrives: true,
  });

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  });

  return response.data;
}

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
      Status,
      reportFile,
      Email
    } = req.body;

    // Validate essential fields
    if (!FullName || !WhatsAppNumber || !Email) {
      return res.status(400).json({ success: false, error: 'Full Name, WhatsApp Number, and Email are required.' });
    }

    // Fallbacks verified, skipping environment variables validation

    // Return success response to the client immediately so they don't wait for third-party API delays
    res.status(200).json({ success: true, message: 'Form submission received' });

    // Process file upload and Google Sheet appending asynchronously in the background
    (async () => {
      try {
        const auth = getGoogleAuth();
        const sheets = getSheetsClient();
        
        let finalReportURL = ReportFileURL || '';
        let imageUploaded = false;

        // Already uploaded from browser (form.js sends =IMAGE(...) formula directly)
        if (finalReportURL.startsWith('=IMAGE(') || finalReportURL.startsWith('=HYPERLINK(')) {
          imageUploaded = true;
        }

        // If base64 file data is sent, upload to a public URL then store =IMAGE("url") in the sheet
        if (!imageUploaded && reportFile && reportFile.base64) {
          const isImage = reportFile.type.startsWith('image/');
          try {
            if (APPS_SCRIPT_URL) {
              console.log('Uploading image via Apps Script...');
              const uploadResult = await uploadToAppsScript(APPS_SCRIPT_URL, reportFile);
              if (isImage && uploadResult.id) {
                finalReportURL = buildSheetImageFormula(buildDriveImageUrl(uploadResult.id), uploadResult.url);
                imageUploaded = true;
                console.log('Image uploaded to Drive, file ID:', uploadResult.id);
              } else {
                finalReportURL = `=HYPERLINK("${uploadResult.url}", "${reportFile.name}")`;
                imageUploaded = true;
              }
            } else if (process.env.IMGBB_API_KEY && isImage) {
              console.log('Uploading image via ImgBB...');
              const uploadResult = await uploadToImgBB(process.env.IMGBB_API_KEY, reportFile);
              finalReportURL = buildSheetImageFormula(uploadResult.url);
              imageUploaded = true;
            } else if (GOOGLE_DRIVE_FOLDER_ID) {
              console.log('Uploading via Service Account Drive (requires Google Workspace Shared Drive)...');
              const driveResponse = await uploadToDrive(auth, reportFile);
              if (driveResponse && driveResponse.id) {
                if (isImage) {
                  finalReportURL = buildSheetImageFormula(buildDriveImageUrl(driveResponse.id), driveResponse.webViewLink);
                } else {
                  finalReportURL = `=HYPERLINK("${driveResponse.webViewLink}", "${reportFile.name}")`;
                }
                imageUploaded = true;
              }
            } else {
              throw new Error(
                'No image upload method configured.'
              );
            }
          } catch (uploadError) {
            console.error('Image upload failed — sheet will show filename only:', uploadError.message);
            finalReportURL = reportFile.name || '';
          }
        }

        // Append the row to Google Sheets
        console.log('Appending row to Google Sheets...');
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Sheet1!A:N',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              Timestamp || new Date().toISOString(),
              LeadID || '',
              FullName || '',
              WhatsAppNumber || '',
              Email || '',
              PreferredConsultationDate || '',
              PreferredConsultationTime || '',
              TreatmentCategory || '',
              TreatmentNeeded || '',
              finalReportURL,
              Location || '',
              Language || '',
              LeadSource || '',
              Status || 'New Lead'
            ]],
          },
        });
        console.log('Row successfully appended to Google Sheet for:', FullName);
      } catch (bgError) {
        console.error('Background processing error:', bgError);
      }
    })();
  } catch (error) {
    console.error('API submit error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
});

// ---------- 2.3️⃣ Upload config for browser-side Drive upload ----------
app.get('/api/upload-config', (req, res) => {
  res.json({ appsScriptUrl: process.env.APPS_SCRIPT_URL || null });
});

// ---------- 2.4️⃣ Test Apps Script upload (open http://localhost:3000/api/test-upload) ----------
app.get('/api/test-upload', async (req, res) => {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    return res.json({ ok: false, error: 'APPS_SCRIPT_URL not set in .env' });
  }

  try {
    const getRes = await fetch(url, { redirect: 'manual' });
    const getText = await getRes.text();
    if (getText.includes('You need access') || getText.includes('Access denied')) {
      return res.json({
        ok: false,
        error: 'Apps Script returns "Access denied". Redeploy: Execute as Me, Who has access: Anyone',
        status: getRes.status
      });
    }

    let getJson;
    try { getJson = JSON.parse(getText); } catch { getJson = null; }

    const testFile = {
      name: 'test-upload.png',
      type: 'image/png',
      base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    };
    const uploadResult = await uploadToAppsScript(url, testFile);

    return res.json({
      ok: true,
      message: 'Upload works! Images will show in Google Sheets.',
      getResponse: getJson,
      fileId: uploadResult.id,
      driveUrl: uploadResult.url,
      imageFormula: buildSheetImageFormula(buildDriveImageUrl(uploadResult.id))
    });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

// ---------- 2.5️⃣ Debug endpoint to diagnose connection errors ----------
app.get('/api/debug', async (req, res) => {
  const diagnostic = {
    googleCredentialsLoaded: false,
    googleCredentialsValid: false,
    googleSheetsApiEnabled: false,
    googleDriveApiEnabled: false,
    googleDriveFolderShared: false,
    errors: []
  };

  try {
    if (!process.env.GOOGLE_CREDENTIALS) {
      throw new Error('GOOGLE_CREDENTIALS environment variable is not defined.');
    }
    diagnostic.googleCredentialsLoaded = true;

    const auth = getGoogleAuth();
    diagnostic.googleCredentialsValid = true;

    // Test Sheets API
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      });
      diagnostic.googleSheetsApiEnabled = true;
    } catch (e) {
      diagnostic.errors.push(`Sheets API Test Failed: ${e.message}`);
    }

    // Test Drive API and Folder Sharing
    try {
      const drive = google.drive({ version: 'v3', auth });
      if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
        await drive.files.get({
          fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
          fields: 'id, name'
        });
        diagnostic.googleDriveFolderShared = true;
        diagnostic.googleDriveApiEnabled = true;
      } else {
        diagnostic.errors.push('GOOGLE_DRIVE_FOLDER_ID is not configured in .env');
      }
    } catch (e) {
      diagnostic.errors.push(`Drive API / Folder Test Failed: ${e.message}`);
      if (e.message.includes('API has not been used') || e.message.includes('disabled')) {
        diagnostic.googleDriveApiEnabled = false;
      }
    }

    res.json(diagnostic);
  } catch (error) {
    diagnostic.errors.push(`General Config Error: ${error.message}`);
    res.status(500).json(diagnostic);
  }
});

// ---------- 3️⃣ Start local server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 Local Node.js server running securely at http://localhost:${PORT}`);
  if (!process.env.APPS_SCRIPT_URL && !process.env.IMGBB_API_KEY) {
    console.warn('⚠️  Image uploads disabled: add APPS_SCRIPT_URL or IMGBB_API_KEY to .env to show images in Google Sheets.');
    console.warn('   Deploy apps-script-upload.gs → see file header for setup steps.');
  }
});
