// form.js - Handles dynamic dropdown, validation, and submission with bilingual support

document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('category');
  const treatmentSelect = document.getElementById('treatment');
  const form = document.getElementById('consultationForm');
  const successSection = document.getElementById('successMessage');

  const dentalOptions = [
    'Dental Implants',
    'Full Mouth Rehabilitation',
    'All-on-4 Implants',
    'All-on-6 Implants',
    'Veneers',
    'Smile Makeover',
    'Zirconia Crowns',
    'Root Canal Treatment',
    'Invisalign'
  ];

  const medicalOptions = [
    'Heart Surgery',
    'Knee Replacement',
    'IVF & Fertility',
    'Neurology',
    'Oncology',
    'Spine Surgery',
    'Cosmetic Surgery',
    'Bariatric Surgery'
  ];

  // Mapping of treatment to cost data and quantity label (for Dental)
  const dentalData = {
    'Dental Implants': { dubai: 5500, india: 1200, qtyLabel: 'Number of Implants' },
    'Full Mouth Rehabilitation': { dubai: 15000, india: 4000, qtyLabel: 'Number of Teeth' },
    'All-on-4': { dubai: 12000, india: 3000, qtyLabel: 'Number of Implants' },
    'All-on-6': { dubai: 18000, india: 4500, qtyLabel: 'Number of Implants' },
    'Veneers': { dubai: 2500, india: 600, qtyLabel: 'Number of Teeth' },
    'Smile Makeover': { dubai: 8000, india: 2000, qtyLabel: 'Number of Teeth' },
    'Zirconia Crowns': { dubai: 3000, india: 800, qtyLabel: 'Number of Crowns' },
    'Root Canal': { dubai: 1500, india: 400, qtyLabel: 'Number of Teeth' },
    'Invisalign': { dubai: 9000, india: 2500, qtyLabel: 'Number of Teeth' },
  };

  const medicalData = {
    'Heart Surgery': { dubai: 25000, india: 8000 },
    'Knee Replacement': { dubai: 18000, india: 6000 },
    'IVF & Fertility': { dubai: 15000, india: 5000 },
    'Neurology': { dubai: 20000, india: 7000 },
    'Oncology': { dubai: 30000, india: 12000 },
    'Spine Surgery': { dubai: 26000, india: 9500 },
    'Cosmetic Surgery': { dubai: 22000, india: 8000 },
    'Bariatric Surgery': { dubai: 21000, india: 7500 },
  };

  // Alias entries for consistency with option labels
  dentalData['All-on-4 Implants'] = dentalData['All-on-4'];
  dentalData['All-on-6 Implants'] = dentalData['All-on-6'];
  dentalData['Root Canal Treatment'] = dentalData['Root Canal'];

  const translations = {
    en: {
      selectCategory: 'Select Category',
      selectTreatment: 'Select Treatment',
      dentalCare: 'Dental Care',
      medicalCare: 'Medical Care',
      dubaiCost: 'Dubai Cost',
      indiaCost: 'India Cost',
      estimatedSavings: 'Estimated Savings',
      dubaiCostLabel: 'Average Dubai Cost',
      indiaCostLabel: 'Average India Cost',
      qtyLabel: {
        'Dental Implants': 'Number of Implants',
        'Full Mouth Rehabilitation': 'Number of Teeth',
        'All-on-4 Implants': 'Number of Implants',
        'All-on-6 Implants': 'Number of Implants',
        'Veneers': 'Number of Teeth',
        'Smile Makeover': 'Number of Teeth',
        'Zirconia Crowns': 'Number of Crowns',
        'Root Canal Treatment': 'Number of Teeth',
        'Invisalign': 'Number of Teeth'
      },
      treatments: {
        'Dental Implants': 'Dental Implants',
        'Full Mouth Rehabilitation': 'Full Mouth Rehabilitation',
        'All-on-4 Implants': 'All-on-4 Implants',
        'All-on-6 Implants': 'All-on-6 Implants',
        'Veneers': 'Veneers',
        'Smile Makeover': 'Smile Makeover',
        'Zirconia Crowns': 'Zirconia Crowns',
        'Root Canal Treatment': 'Root Canal Treatment',
        'Invisalign': 'Invisalign',
        'Heart Surgery': 'Heart Surgery',
        'Knee Replacement': 'Knee Replacement',
        'IVF & Fertility': 'IVF & Fertility Care',
        'Neurology': 'Neurology',
        'Oncology': 'Oncology',
        'Spine Surgery': 'Spine Surgery',
        'Cosmetic Surgery': 'Cosmetic Surgery',
        'Bariatric Surgery': 'Bariatric Surgery'
      },
      submitText: 'Get Free Treatment Plan',
      submittingText: 'Transmitting VIP File...',
      whatsappError: 'WhatsApp number must start with +971 followed by 9 digits (e.g. +971501234567)',
      successTitle: 'Thank You!',
      successMsg1: 'Your request has been submitted successfully.',
      successMsg2: 'Our patient coordinator will contact you on WhatsApp within 24 hours with treatment options, estimated costs, and next steps.'
    },
    ar: {
      selectCategory: 'اختر الفئة',
      selectTreatment: 'اختر العلاج',
      dentalCare: 'رعاية الأسنان',
      medicalCare: 'الرعاية الطبية',
      dubaiCost: 'التكلفة في دبي',
      indiaCost: 'التكلفة في الهند',
      estimatedSavings: 'التوفير التقديري',
      dubaiCostLabel: 'متوسط التكلفة في دبي',
      indiaCostLabel: 'متوسط التكلفة في الهند',
      qtyLabel: {
        'Dental Implants': 'عدد الغرسات',
        'Full Mouth Rehabilitation': 'عدد الأسنان',
        'All-on-4 Implants': 'عدد الغرسات',
        'All-on-6 Implants': 'عدد الغرسات',
        'Veneers': 'عدد الأسنان',
        'Smile Makeover': 'عدد الأسنان',
        'Zirconia Crowns': 'عدد التيجان',
        'Root Canal Treatment': 'عدد الأسنان',
        'Invisalign': 'عدد الأسنان'
      },
      treatments: {
        'Dental Implants': 'زراعة الأسنان',
        'Full Mouth Rehabilitation': 'إعادة تأهيل كامل للفم',
        'All-on-4 Implants': 'زراعة أسنان All-on-4',
        'All-on-6 Implants': 'زراعة أسنان All-on-6',
        'Veneers': 'فينير الأسنان',
        'Smile Makeover': 'تجميل الابتسامة',
        'Zirconia Crowns': 'تيجان الزيركون',
        'Root Canal Treatment': 'علاج عصب الأسنان',
        'Invisalign': 'تقويم إنفزلاين',
        'Heart Surgery': 'جراحة القلب',
        'Knee Replacement': 'استبدال مفصل الركبة',
        'IVF & Fertility': 'أطفال الأنابيب والخصوبة',
        'Neurology': 'جراحة الأعصاب',
        'Oncology': 'علاج الأورام والسرطان',
        'Spine Surgery': 'جراحة العمود الفقري',
        'Cosmetic Surgery': 'جراحة التجميل',
        'Bariatric Surgery': 'جراحة السمنة وتكميم المعدة'
      },
      submitText: 'احصل على خطة علاج مجانية',
      submittingText: 'جاري إرسال الملف الطبي...',
      whatsappError: 'يجب أن يبدأ رقم الواتساب بـ +971 متبوعاً بـ 9 أرقام (مثال: +971501234567)',
      successTitle: 'شكراً لك!',
      successMsg1: 'تم تقديم طلبك بنجاح.',
      successMsg2: 'سيتواصل معك منسق المرضى لدينا عبر الواتساب خلال 24 ساعة لتقديم خيارات العلاج، التكاليف التقديرية، والخطوات التالية.'
    }
  };

  const renderCalculator = (category, treatment) => {
    const container = document.getElementById('calculatorContainer');
    if (!container) return;
    
    container.innerHTML = '';
    if (!treatment) return;

    const lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
    const t = translations[lang];

    if (category === 'Dental Care') {
      const data = dentalData[treatment];
      if (!data) return;
      
      const qtyText = t.qtyLabel[treatment] || 'Quantity';
      
      container.innerHTML = `
        <div class="calc-section">
          <h3 class="calc-title">${t.treatments[treatment] || treatment}</h3>
          <div class="form-group">
            <label for="quantity" class="form-label">${qtyText}</label>
            <input type="number" id="quantity" min="1" value="1" class="calc-input" />
          </div>
          <div class="calc-results">
            <p><span>${t.dubaiCost}:</span> <span id="dubaiCost"></span></p>
            <p><span>${t.indiaCost}:</span> <span id="indiaCost"></span></p>
            <p><span>${t.estimatedSavings}:</span> <span id="savings"></span></p>
          </div>
        </div>
      `;
      
      const qtyInput = document.getElementById('quantity');
      const updateResults = () => {
        const qty = parseInt(qtyInput.value) || 1;
        const dubai = data.dubai * qty;
        const india = data.india * qty;
        const save = dubai - india;
        document.getElementById('dubaiCost').textContent = `AED ${dubai.toLocaleString()}`;
        document.getElementById('indiaCost').textContent = `AED ${india.toLocaleString()}`;
        document.getElementById('savings').textContent = `AED ${save.toLocaleString()}`;
      };
      qtyInput.addEventListener('input', updateResults);
      updateResults();
    } else if (category === 'Medical Care') {
      const data = medicalData[treatment];
      if (!data) return;
      
      container.innerHTML = `
        <div class="calc-section">
          <h3 class="calc-title">${t.treatments[treatment] || treatment}</h3>
          <div class="calc-results">
            <p><span>${t.dubaiCostLabel}:</span> <span id="dubaiCost">AED ${data.dubai.toLocaleString()}</span></p>
            <p><span>${t.indiaCostLabel}:</span> <span id="indiaCost">AED ${data.india.toLocaleString()}</span></p>
            <p><span>${t.estimatedSavings}:</span> <span id="savings">AED ${(data.dubai - data.india).toLocaleString()}</span></p>
          </div>
        </div>
      `;
    }
  };

  const updateLanguage = () => {
    const lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
    const t = translations[lang];

    // Set dynamic language hidden input
    const langHidden = document.getElementById('hiddenLanguage');
    if (langHidden) {
      langHidden.value = lang === 'ar' ? 'Arabic' : 'English';
    }

    // Update placeholders
    const fullNameInput = document.getElementById('fullName');
    const whatsappInput = document.getElementById('whatsapp');
    const notesInput = document.getElementById('notes');
    
    if (form) {
      const submitBtn = form.querySelector('.submit-btn');
      if (submitBtn) {
        submitBtn.innerHTML = `<span class="lang-en">${translations.en.submitText}</span><span class="lang-ar">${translations.ar.submitText}</span>`;
      }
    }

    if (fullNameInput) {
      fullNameInput.placeholder = lang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter Your Full Name';
    }
    if (whatsappInput) {
      whatsappInput.placeholder = '+971 XX XXX XXXX';
    }
    if (notesInput) {
      notesInput.placeholder = lang === 'ar' ? 'أخبرنا عن احتياجاتك أو مخاوفك العلاجية.' : 'Tell us about your treatment needs or concerns.';
    }

    // Update Category dropdown options
    if (categorySelect) {
      const selectedValue = categorySelect.value;
      categorySelect.innerHTML = `
        <option value="" disabled ${!selectedValue ? 'selected' : ''}>${t.selectCategory}</option>
        <option value="Dental Care" ${selectedValue === 'Dental Care' ? 'selected' : ''}>${t.dentalCare}</option>
        <option value="Medical Care" ${selectedValue === 'Medical Care' ? 'selected' : ''}>${t.medicalCare}</option>
      `;
    }

    // Re-populate treatments dropdown
    if (categorySelect && categorySelect.value) {
      const selectedCat = categorySelect.value;
      const selectedTreat = treatmentSelect.value;
      const opts = selectedCat === 'Dental Care' ? dentalOptions : medicalOptions;
      
      treatmentSelect.innerHTML = `<option value="" disabled ${!selectedTreat ? 'selected' : ''}>${t.selectTreatment}</option>`;
      opts.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = t.treatments[opt] || opt;
        if (opt === selectedTreat) {
          el.selected = true;
        }
        treatmentSelect.appendChild(el);
      });

      // Re-render calculator with active language
      if (selectedTreat) {
        renderCalculator(selectedCat, selectedTreat);
      }
    } else if (treatmentSelect) {
      treatmentSelect.innerHTML = `<option value="" disabled selected>${t.selectTreatment}</option>`;
    }
    
    // Update success section texts dynamically
    if (successSection) {
      successSection.innerHTML = `
        <h2>${t.successTitle}</h2>
        <p>${t.successMsg1}</p>
        <p>${t.successMsg2}</p>
      `;
    }
  };

  // Update treatments and attach calculator rendering
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      const lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
      const t = translations[lang];
      
      if (e.target.value === 'Dental Care') {
        populateTreatments(dentalOptions, t.selectTreatment, t.treatments);
      } else if (e.target.value === 'Medical Care') {
        populateTreatments(medicalOptions, t.selectTreatment, t.treatments);
      }
      
      // Reset calculator when category changes
      const calcContainer = document.getElementById('calculatorContainer');
      if (calcContainer) calcContainer.innerHTML = '';
    });
  }

  const populateTreatments = (options, selectPlaceholder, localizedTreatments) => {
    if (!treatmentSelect) return;
    treatmentSelect.innerHTML = `<option value="" disabled selected>${selectPlaceholder}</option>`;
    options.forEach((opt) => {
      const el = document.createElement('option');
      el.value = opt;
      el.textContent = localizedTreatments[opt] || opt;
      treatmentSelect.appendChild(el);
    });
  };

  // Render calculator when a treatment is selected
  if (treatmentSelect) {
    treatmentSelect.addEventListener('change', (e) => {
      const category = categorySelect.value;
      const treatment = e.target.value;
      renderCalculator(category, treatment);
    });
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate WhatsApp number start and length
      const whatsappInput = document.getElementById('whatsapp');
      let phoneVal = '';
      if (whatsappInput) {
        phoneVal = whatsappInput.value.trim().replace(/[\s\-()]/g, '');
        const uaeRegex = /^\+971[0-9]{9}$/;
        if (!uaeRegex.test(phoneVal)) {
          const lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
          alert(translations[lang].whatsappError);
          whatsappInput.focus();
          return;
        }
      }

      // Generate parameters matching Google Sheets requirement
      const leadId = 'LD' + Math.floor(100000 + Math.random() * 900000);
      const timestamp = new Date().toISOString();
      
      const datetimeInput = document.getElementById('datetime');
      let dateVal = '';
      let timeVal = '';
      if (datetimeInput && datetimeInput.value) {
        const dt = new Date(datetimeInput.value);
        dateVal = dt.toLocaleDateString('en-GB').replace(/\//g, '-'); // dd-mm-yyyy format
        timeVal = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const payload = {
        Timestamp: timestamp,
        LeadID: leadId,
        FullName: document.getElementById('fullName').value,
        WhatsAppNumber: phoneVal,
        PreferredConsultationDate: dateVal,
        PreferredConsultationTime: timeVal,
        TreatmentCategory: categorySelect.value,
        TreatmentNeeded: treatmentSelect.value,
        ReportFileURL: document.getElementById('report').files[0]?.name || '',
        Location: document.getElementById('hiddenLocation').value,
        Language: document.getElementById('hiddenLanguage').value,
        LeadSource: document.getElementById('hiddenLeadSource').value,
        Status: document.getElementById('hiddenStatus').value
      };

      console.log('--- SAVE TO GOOGLE SHEETS PAYLOAD ---');
      console.table(payload);

      // Submit visual transition
      const submitBtn = form.querySelector('.submit-btn');
      const lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
      submitBtn.textContent = translations[lang].submittingText;
      submitBtn.disabled = true;

      try {
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
          form.classList.add('hidden');
          if (successSection) {
            successSection.classList.remove('hidden');
            successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          throw new Error(result.error || 'Server error occurred');
        }
      } catch (err) {
        console.error("Submission error:", err);
        alert(lang === 'ar' ? 'فشل إرسال الطلب. يرجى المحاولة مرة أخرى.' : 'Failed to submit. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = translations[lang].submitText;
      }
    });
  }

  // Handle Hero Lead Form (Scrolls and fills the main consultation form)
  const heroForm = document.getElementById('heroLeadForm');
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameVal = heroForm.querySelector('input[name="name"]')?.value || '';
      const whatsappVal = heroForm.querySelector('input[name="whatsapp"]')?.value || '';
      
      const mainName = document.getElementById('fullName');
      const mainWhatsapp = document.getElementById('whatsapp');
      
      if (mainName) mainName.value = nameVal;
      if (mainWhatsapp) mainWhatsapp.value = whatsappVal;
      
      const consultationSection = document.getElementById('consultation');
      if (consultationSection) {
        consultationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      if (categorySelect) {
        setTimeout(() => {
          categorySelect.focus();
        }, 800);
      }
    });
  }

  // Listen to Language Changes
  window.addEventListener('languageChanged', () => {
    updateLanguage();
  });

  // Run initial localization setup
  updateLanguage();
});
