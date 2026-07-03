/**
 * Patient Report Upload & Sheet Saving — Google Apps Script
 *
 * SETUP (one-time, ~2 minutes):
 * 1. Open your Apps Script project (https://script.google.com)
 * 2. Erase the old code and paste this entire code.
 * 3. Click "Save" (disk icon).
 * 4. Click Deploy → New deployment.
 *    - Click the gear icon next to "Select type" and choose "Web app".
 *    - Description: Save Leads and Upload Files
 *    - Execute as: Me (your-email@gmail.com)
 *    - Who has access: Anyone
 *    - Click "Deploy".
 * 5. If prompted, click "Authorize access" and log in with your Google account to grant permissions.
 * 6. Copy the new "Web app URL" (it should be the same as before if you updated the deployment, but copy it just in case).
 */

const SPREADSHEET_ID = '1REDw-JvWGkKQJ2KhNyiUZLnYQlhvNuzDf6QoEizqnYU'; // Your Spreadsheet ID
const FOLDER_ID = '1wTILjOi4GMxrQKlrw3mhUpaVg_P8kscg';       // Your Drive Folder ID

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'No POST data received' });
    }

    const data = JSON.parse(e.postData.contents);
    
    let finalReportURL = '';
    
    // 1. Upload report file to Google Drive if present
    if (data.reportFile && data.reportFile.base64) {
      const raw = data.reportFile.base64 || '';
      const base64Data = raw.indexOf(',') >= 0 ? raw.split(',')[1] : raw;

      const blob = Utilities.newBlob(
        Utilities.base64Decode(base64Data),
        data.reportFile.type || 'application/octet-stream',
        data.reportFile.name || 'upload'
      );

      const folder = DriveApp.getFolderById(FOLDER_ID);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const fileId = file.getId();
      const isImage = (data.reportFile.type || '').startsWith('image/');
      
      if (isImage) {
        finalReportURL = '=HYPERLINK("' + file.getUrl() + '", IMAGE("https://lh3.googleusercontent.com/d/' + fileId + '"))';
      } else {
        finalReportURL = '=HYPERLINK("' + file.getUrl() + '", "' + data.reportFile.name + '")';
      }
    } else {
      finalReportURL = data.ReportFileURL || '';
    }

    // 2. Append row directly to Google Sheets
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    
    sheet.appendRow([
      data.Timestamp || new Date().toISOString(),
      data.LeadID || '',
      data.FullName || '',
      data.WhatsAppNumber || '',
      data.Email || '',
      data.PreferredConsultationDate || '',
      data.PreferredConsultationTime || '',
      data.TreatmentCategory || '',
      data.TreatmentNeeded || '',
      finalReportURL,
      data.Location || '',
      data.Language || '',
      data.LeadSource || '',
      data.Status || 'New Lead'
    ]);

    return jsonResponse({ success: true, message: 'Lead saved successfully' });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err.message || err) });
  }
}

function doGet() {
  try {
    DriveApp.getFolderById(FOLDER_ID);
    SpreadsheetApp.openById(SPREADSHEET_ID);
    return jsonResponse({ success: true, message: 'Upload & Sheet saving endpoint ready.' });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Authorization or Folder/Sheet access error: ' + err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
