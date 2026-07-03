const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbw2aE4KIel66xfARsNRfRu5KUYQE5FpaaG8e6G1b8YUl8Rc_DAOr-Ga12LUQNyG_93U/exec';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

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

    console.log('Forwarding form submission to Google Apps Script...');
    
    // Call Apps Script to handle both file upload and Google Sheet append
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`Apps Script responded with invalid JSON: ${text.slice(0, 100)}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Apps Script execution failed');
    }

    return res.status(200).json({ success: true, message: 'Form submission saved successfully' });

  } catch (error) {
    console.error('Request processing failed:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
  }
};
