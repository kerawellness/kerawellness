// Helper function to compress images client-side before uploading
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

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

  const countryConfig = {
    AE: { code: '+971', placeholder: '+971 50 123 4567', digits: 9, regex: /^\+971[0-9]{9}$/, nameEn: 'United Arab Emirates (+971)', nameAr: 'الإمارات العربية المتحدة (+971)' },
    SA: { code: '+966', placeholder: '+966 50 123 4567', digits: 9, regex: /^\+966[0-9]{9}$/, nameEn: 'Saudi Arabia (+966)', nameAr: 'المملكة العربية السعودية (+966)' },
    OM: { code: '+968', placeholder: '+968 9123 4567', digits: 8, regex: /^\+968[0-9]{8}$/, nameEn: 'Oman (+968)', nameAr: 'سلطنة عمان (+968)' },
    QA: { code: '+974', placeholder: '+974 5512 3456', digits: 8, regex: /^\+974[0-9]{8}$/, nameEn: 'Qatar (+974)', nameAr: 'قطر (+974)' },
    BH: { code: '+973', placeholder: '+973 3912 3456', digits: 8, regex: /^\+973[0-9]{8}$/, nameEn: 'Bahrain (+973)', nameAr: 'البحرين (+973)' },
    KW: { code: '+965', placeholder: '+965 5123 4567', digits: 8, regex: /^\+965[0-9]{8}$/, nameEn: 'Kuwait (+965)', nameAr: 'الكويت (+965)' },
    IN: { code: '+91', placeholder: '+91 98765 43210', digits: 10, regex: /^\+91[0-9]{10}$/, nameEn: 'India (+91)', nameAr: 'الهند (+91)' },
    US: { code: '+1', placeholder: '+1 202 555 0123', digits: 10, regex: /^\+1[0-9]{10}$/, nameEn: 'United States (+1)', nameAr: 'الولايات المتحدة (+1)' },
    GB: { code: '+44', placeholder: '+44 7911 123456', digits: 10, regex: /^\+44[0-9]{10}$/, nameEn: 'United Kingdom (+44)', nameAr: 'المملكة المتحدة (+44)' },
    CA: { code: '+1', placeholder: '+1 416 555 0123', digits: 10, regex: /^\+1[0-9]{10}$/, nameEn: 'Canada (+1)', nameAr: 'كندا (+1)' },
    AU: { code: '+61', placeholder: '+61 412 345 678', digits: 9, regex: /^\+61[0-9]{9}$/, nameEn: 'Australia (+61)', nameAr: 'أستراليا (+61)' },
    EG: { code: '+20', placeholder: '+20 10 1234 5678', digits: 10, regex: /^\+20[0-9]{10}$/, nameEn: 'Egypt (+20)', nameAr: 'مصر (+20)' },
    JO: { code: '+962', placeholder: '+962 7 9123 4567', digits: 9, regex: /^\+962[0-9]{9}$/, nameEn: 'Jordan (+962)', nameAr: 'الأردن (+962)' },
    LB: { code: '+961', placeholder: '+961 71 123 456', digits: 8, regex: /^\+961[0-9]{8}$/, nameEn: 'Lebanon (+961)', nameAr: 'لبنان (+961)' },
    SY: { code: '+963', placeholder: '+963 91 234 5678', digits: 9, regex: /^\+963[0-9]{9}$/, nameEn: 'Syria (+963)', nameAr: 'سوريا (+963)' },
    IQ: { code: '+964', placeholder: '+964 770 123 4567', digits: 10, regex: /^\+964[0-9]{10}$/, nameEn: 'Iraq (+964)', nameAr: 'العراق (+964)' },
    YE: { code: '+967', placeholder: '+967 71 234 5678', digits: 9, regex: /^\+967[0-9]{9}$/, nameEn: 'Yemen (+967)', nameAr: 'اليمن (+967)' },
    PS: { code: '+970', placeholder: '+970 59 123 4567', digits: 9, regex: /^\+970[0-9]{9}$/, nameEn: 'Palestine (+970)', nameAr: 'فلسطين (+970)' },
    SD: { code: '+249', placeholder: '+249 91 234 5678', digits: 9, regex: /^\+249[0-9]{9}$/, nameEn: 'Sudan (+249)', nameAr: 'السودان (+249)' },
    LY: { code: '+218', placeholder: '+218 91 123 4567', digits: 9, regex: /^\+218[0-9]{9}$/, nameEn: 'Libya (+218)', nameAr: 'ليبيا (+218)' },
    TN: { code: '+216', placeholder: '+216 98 123 456', digits: 8, regex: /^\+216[0-9]{8}$/, nameEn: 'Tunisia (+216)', nameAr: 'تونس (+216)' },
    DZ: { code: '+213', placeholder: '+213 550 12 34 56', digits: 9, regex: /^\+213[0-9]{9}$/, nameEn: 'Algeria (+213)', nameAr: 'الجزائر (+213)' },
    MA: { code: '+212', placeholder: '+212 612 345678', digits: 9, regex: /^\+212[0-9]{9}$/, nameEn: 'Morocco (+212)', nameAr: 'المغرب (+212)' },
    PK: { code: '+92', placeholder: '+92 300 1234567', digits: 10, regex: /^\+92[0-9]{10}$/, nameEn: 'Pakistan (+92)', nameAr: 'باكستان (+92)' },
    BD: { code: '+880', placeholder: '+880 17 1234 5678', digits: 10, regex: /^\+880[0-9]{10}$/, nameEn: 'Bangladesh (+880)', nameAr: 'بنغلاديش (+880)' },
    PH: { code: '+63', placeholder: '+63 917 123 4567', digits: 10, regex: /^\+63[0-9]{10}$/, nameEn: 'Philippines (+63)', nameAr: 'الفلبين (+63)' },
    LK: { code: '+94', placeholder: '+94 77 123 4567', digits: 9, regex: /^\+94[0-9]{9}$/, nameEn: 'Sri Lanka (+94)', nameAr: 'سريلانكا (+94)' },
    NP: { code: '+977', placeholder: '+977 98 1234 5678', digits: 10, regex: /^\+977[0-9]{10}$/, nameEn: 'Nepal (+977)', nameAr: 'نيبال (+977)' },
    DE: { code: '+49', placeholder: '+49 170 1234567', digits: 11, regex: /^\+49[0-9]{10,11}$/, nameEn: 'Germany (+49)', nameAr: 'ألمانيا (+49)' },
    FR: { code: '+33', placeholder: '+33 6 1234 5678', digits: 9, regex: /^\+33[0-9]{9}$/, nameEn: 'France (+33)', nameAr: 'فرنسا (+33)' },
    IT: { code: '+39', placeholder: '+39 312 345 6789', digits: 10, regex: /^\+39[0-9]{10}$/, nameEn: 'Italy (+39)', nameAr: 'إيطاليا (+39)' },
    ES: { code: '+34', placeholder: '+34 612 345 678', digits: 9, regex: /^\+34[0-9]{9}$/, nameEn: 'Spain (+34)', nameAr: 'إسبانيا (+34)' },
    TR: { code: '+90', placeholder: '+90 532 123 4567', digits: 10, regex: /^\+90[0-9]{10}$/, nameEn: 'Turkey (+90)', nameAr: 'تركيا (+90)' },
    RU: { code: '+7', placeholder: '+7 912 345-67-89', digits: 10, regex: /^\+7[0-9]{10}$/, nameEn: 'Russia (+7)', nameAr: 'روسيا (+7)' },
    ZA: { code: '+27', placeholder: '+27 82 123 4567', digits: 9, regex: /^\+27[0-9]{9}$/, nameEn: 'South Africa (+27)', nameAr: 'جنوب أفريقيا (+27)' },
    NG: { code: '+234', placeholder: '+234 803 123 4567', digits: 10, regex: /^\+234[0-9]{10}$/, nameEn: 'Nigeria (+234)', nameAr: 'نيجيريا (+234)' },
    KE: { code: '+254', placeholder: '+254 712 345678', digits: 9, regex: /^\+254[0-9]{9}$/, nameEn: 'Kenya (+254)', nameAr: 'كينيا (+254)' },
    OTHER: { code: '+', placeholder: '+1 234 567 8900', digits: 15, regex: /^\+[0-9]{7,15}$/, nameEn: 'Other Country', nameAr: 'دولة أخرى' }
  };

  const translations = {
    en: {
      selectCategory: 'Select Category',
      selectTreatment: 'Select Treatment',
      selectCountry: 'Select Country',
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
      successTitle: 'Thank You!',
      successMsg1: 'Your request has been submitted successfully.',
      successMsg2: 'Our patient coordinator will contact you on WhatsApp within 24 hours with treatment options, estimated costs, and next steps.'
    },
    ar: {
      selectCategory: 'اختر الفئة',
      selectTreatment: 'اختر العلاج',
      selectCountry: 'اختر الدولة',
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
    if (notesInput) {
      notesInput.placeholder = lang === 'ar' ? 'أخبرنا عن احتياجاتك أو مخاوفك العلاجية.' : 'Tell us about your treatment needs or concerns.';
    }

    // Update Country dropdown options
    const countrySelect = document.getElementById('country');
    if (countrySelect) {
      const selectedValue = countrySelect.value;
      let html = `<option value="" disabled ${!selectedValue ? 'selected' : ''}>${t.selectCountry}</option>`;
      Object.keys(countryConfig).forEach(key => {
        const item = countryConfig[key];
        const label = lang === 'ar' ? item.nameAr : item.nameEn;
        html += `<option value="${key}" data-code="${item.code}" ${selectedValue === key ? 'selected' : ''}>${label}</option>`;
      });
      countrySelect.innerHTML = html;

      // Update phone placeholder and prefix
      if (selectedValue && whatsappInput) {
        const config = countryConfig[selectedValue] || countryConfig.OTHER;
        whatsappInput.placeholder = config.placeholder;
      }
    } else if (whatsappInput) {
      whatsappInput.placeholder = '+971 XX XXX XXXX';
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

  // Handle Country selection and WhatsApp prefix
  const countrySelectEl = document.getElementById('country');
  const whatsappInputEl = document.getElementById('whatsapp');
  if (countrySelectEl && whatsappInputEl) {
    countrySelectEl.addEventListener('change', () => {
      const val = countrySelectEl.value;
      const config = countryConfig[val] || countryConfig.OTHER;
      
      // If empty or starts with previous code, replace it
      if (!whatsappInputEl.value || whatsappInputEl.value.startsWith('+')) {
        whatsappInputEl.value = config.code;
      }
      whatsappInputEl.placeholder = config.placeholder;
    });
  }

  // Handle Medical Report Image Preview
  const reportInput = document.getElementById('report');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImage = document.getElementById('imagePreview');
  const removeBtn = document.getElementById('removeImageBtn');

  if (reportInput && previewContainer && previewImage) {
    reportInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImage.src = event.target.result;
          previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        previewContainer.style.display = 'none';
        previewImage.src = '';
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        reportInput.value = '';
        previewContainer.style.display = 'none';
        previewImage.src = '';
      });
    }
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get WhatsApp number (without regex formatting limit)
      const whatsappInput = document.getElementById('whatsapp');
      let phoneVal = '';
      if (whatsappInput) {
        phoneVal = whatsappInput.value.trim();
      }

      // Validate email format
      const emailInput = document.getElementById('email');
      let emailVal = '';
      if (emailInput) {
        emailVal = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
          const lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
          const errorMsg = lang === 'ar' ? 
            'يرجى إدخال عنوان بريد إلكتروني صحيح' : 
            'Please enter a valid email address';
          alert(errorMsg);
          emailInput.focus();
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

      const countrySelect = document.getElementById('country');
      const countryStr = countrySelect ? countrySelect.value : 'AE';

      // Read report file as base64 if present, then upload to Google Drive via Apps Script
      let reportFileData = null;
      let reportFileURL = '';
      const fileInput = document.getElementById('report');
      let file = fileInput ? fileInput.files[0] : null;

      if (file) {
        if (file.type.startsWith('image/')) {
          try {
            file = await compressImage(file);
          } catch (compressErr) {
            console.warn('Image compression failed, using original file:', compressErr);
          }
        }

        reportFileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              base64: event.target.result,
              name: file.name,
              type: file.type
            });
          };
          reader.readAsDataURL(file);
        });

        reportFileURL = file.name;
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
        ReportFileURL: reportFileURL,
        Location: (countryConfig[countryStr] && countryConfig[countryStr].nameEn) ? countryConfig[countryStr].nameEn.split(' (')[0] : 'United Arab Emirates',
        Language: document.getElementById('hiddenLanguage').value,
        LeadSource: document.getElementById('hiddenLeadSource').value,
        Status: document.getElementById('hiddenStatus').value,
        Email: emailVal,
        reportFile: reportFileData
      };

      console.log('--- SAVE TO GOOGLE SHEETS PAYLOAD ---');
      console.table(payload);

      // Submit visual transition
      const submitBtn = form.querySelector('.submit-btn');
      const lang = document.documentElement.getAttribute('lang') === 'ar' ? 'ar' : 'en';
      submitBtn.textContent = translations[lang].submittingText;
      submitBtn.disabled = true;

      // Send submission request in the background
      fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).catch(err => {
        console.error("Submission background error:", err);
      });

      // Transition to success screen instantly for a better user experience
      form.classList.add('hidden');
      if (successSection) {
        successSection.classList.remove('hidden');
        successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
