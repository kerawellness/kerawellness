/**
 * Patient Report Upload — Google Apps Script
 *
 * SETUP (one-time, ~5 minutes):
 * 1. Open https://script.google.com → New project
 * 2. Paste this entire file, replace FOLDER_ID below with your Drive folder ID
 *    (from the folder URL: drive.google.com/drive/folders/FOLDER_ID)
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL → add to .env as APPS_SCRIPT_URL=<url>
 * 5. Restart the server (npm run dev)
 *
 * Images will appear in Google Sheets via =IMAGE("https://lh3.googleusercontent.com/d/FILE_ID")
 */

const FOLDER_ID = '1wTILjOi4GMxrQKlrw3mhUpaVg_P8kscg'; // Patient Reports folder

/** Run this once from the Script Editor (Run → testUpload) to verify Drive access */
function testUpload() {
  const blob = Utilities.newBlob('test', 'text/plain', 'apps-script-test.txt');
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log('SUCCESS — file created: ' + file.getUrl());
  file.setTrashed(true);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'No POST data received' });
    }

    const data = JSON.parse(e.postData.contents);
    const raw = data.base64 || '';
    const base64Data = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;

    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      data.type || 'application/octet-stream',
      data.name || 'upload'
    );

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    return jsonResponse({
      success: true,
      id: fileId,
      url: file.getUrl(),
      imageFormula: '=IMAGE("https://lh3.googleusercontent.com/d/' + fileId + '")'
    });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err.message || err) });
  }
}

function doGet() {
  try {
    DriveApp.getFolderById(FOLDER_ID);
    return jsonResponse({ success: true, message: 'Upload endpoint ready. Drive folder OK.' });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Drive folder error: ' + err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
