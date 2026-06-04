/* ===================================
   RECRUITMENT TRACKER - FILE PROCESSOR
   File Upload & Parsing Module (with Excel Date Conversion)
   =================================== */

// Global variable to store processed data
let candidatesData = [];

// Date field names that need conversion from Excel serial numbers
const DATE_FIELDS = [
    'MRF Date',
    'Evaluation Received',
    'Date Offer Letter Prepared',
    'Job Offer Issued',
    'Job Accepted',
    'Visa documents received',
    'Visa Applied',
    'Visa Issued',
    'Bah Arrival Date',
    'Mobilized',
    'LMRA Enrollment',
    'CPR',
    'LMRA Medical',
    'Health Card',
    'Company ID CARD',
    'Gate Pass'
];

/**
 * Initialize file upload functionality
 */
function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
        console.log('📁 File upload initialized');
    }
}

/**
 * Handle file upload event
 * @param {Event} event - File input change event
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📄 Processing file:', file.name);
    showLoading('Processing file...');
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
        processCSVFile(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        processExcelFile(file);
    } else {
        showError('Unsupported file format. Please use CSV or Excel files.');
    }
}

/**
 * Process CSV file using PapaParse
 * @param {File} file - CSV file to process
 */
function processCSVFile(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log('✅ CSV parsed successfully');
            processData(results.data, results.meta.fields);
        },
        error: function(error) {
            console.error('❌ CSV parsing error:', error);
            showError('Error reading CSV file: ' + error.message);
        }
    });
}

/**
 * Process Excel file using SheetJS with proper date conversion
 * @param {File} file - Excel file to process
 */
function processExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { 
                type: 'array',
                cellDates: true,  // Enable date parsing
                cellNF: false,    // Don't format numbers
                cellHTML: false   // Don't use HTML
            });
            
            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON with date handling
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: null,
                blankrows: false
            });
            
            if (jsonData.length === 0) {
                showError('Excel file appears to be empty');
                return;
            }
            
            // Convert to object format with proper date conversion
            const headers = jsonData[0].map(h => String(h).trim());
            const rows = jsonData.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    let value = row[index];
                    
                    // Convert Excel dates to dd-mmm-yy format
                    if (DATE_FIELDS.includes(header) && value !== null && value !== undefined) {
                        value = convertExcelDateToString(value);
                    }
                    
                    obj[header] = value;
                });
                return obj;
            });
            
            console.log('✅ Excel parsed successfully with date conversion');
            console.log('📅 Sample date conversion check:', {
                'MRF Date': rows[0]?.['MRF Date'],
                'Mobilized': rows[0]?.['Mobilized']
            });
            
            processData(rows, headers);
        } catch (error) {
            console.error('❌ Excel parsing error:', error);
            showError('Error reading Excel file: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Convert Excel date (serial number or Date object) to dd-mmm-yy format
 * @param {number|Date|string} excelDate - Excel date value
 * @returns {string|null} Formatted date string or null if invalid
 */
function convertExcelDateToString(excelDate) {
    try {
        let date;
        
        // Handle different input types
        if (typeof excelDate === 'number') {
            // Excel serial number (e.g., 45762)
            // Excel dates start from January 1, 1900, but with a leap year bug
            const excelEpoch = new Date(1900, 0, 1);
            date = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
        } else if (excelDate instanceof Date) {
            // Already a Date object
            date = excelDate;
        } else if (typeof excelDate === 'string') {
            // String that might already be in dd-mmm-yy format
            if (excelDate.match(/^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/)) {
                return excelDate; // Already in correct format
            }
            // Try parsing as date
            date = new Date(excelDate);
        } else {
            return null; // Invalid input
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return null;
        }
        
        // Format to dd-mmm-yy
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const year = String(date.getFullYear()).slice(-2); // Get last 2 digits
        
        return `${day}-${month}-${year}`;
        
    } catch (error) {
        console.warn('⚠️ Date conversion error for value:', excelDate, error);
        return null;
    }
}

/**
 * Process and validate parsed data
 * @param {Array} data - Raw parsed data
 * @param {Array} headers - Column headers
 */
function processData(data, headers) {
    try {
        console.log('📄 Processing data...');
        
        // Clean and process the data
        candidatesData = cleanData(data);
        console.log('✅ Cleaned data rows:', candidatesData.length);
        
        // Validate data structure
        const validation = validateDataStructure(candidatesData, headers);
        if (!validation.isValid) {
            showError(`Data validation failed: ${validation.errors.join(', ')}`);
            return;
        }
        
        // Display file info
        displayDataInfo(candidatesData.length, headers.length);
        
        // Calculate and display results
        calculateAndDisplay();
        
        // BACKUP: Ensure filter system is initialized
        setTimeout(() => {
            if (typeof initializeFilterSystem === 'function') {
                console.log('🔍 Backup filter initialization...');
                initializeFilterSystem();
            }
        }, 200);
        
        // Show results with animation
        const resultsContainer = document.getElementById('results');
        resultsContainer.style.display = 'block';
        resultsContainer.classList.add('fade-in');
        
        hideLoading();
        console.log('🎉 Data processing complete!');
        
    } catch (error) {
        console.error('❌ Data processing error:', error);
        showError('Error processing data: ' + error.message);
    }
}

/**
 * Clean and normalize raw data
 * @param {Array} rawData - Raw data from file
 * @returns {Array} Cleaned data
 */
function cleanData(rawData) {
    return rawData.filter(row => {
        // Remove completely empty rows
        return Object.values(row).some(value => 
            value !== null && value !== undefined && String(value).trim() !== ''
        );
    }).map(row => {
        // Clean individual row data
        const cleaned = {};
        Object.keys(row).forEach(key => {
            const cleanKey = String(key).trim();
            let value = row[key];
            
            // Convert to string and clean (except for null dates)
            if (value !== null && value !== undefined) {
                // Don't convert dates to string if they're already formatted
                if (DATE_FIELDS.includes(cleanKey) && typeof value === 'string') {
                    cleaned[cleanKey] = value; // Keep date strings as-is
                } else {
                    value = String(value).trim();
                    if (value === '' || value === 'undefined' || value === 'null') {
                        value = null;
                    }
                    cleaned[cleanKey] = value;
                }
            } else {
                cleaned[cleanKey] = value;
            }
        });
        return cleaned;
    });
}

/**
 * Validate data structure and required fields
 * @param {Array} data - Cleaned data
 * @param {Array} headers - Column headers
 * @returns {Object} Validation result
 */
function validateDataStructure(data, headers) {
    const errors = [];
    
    // Check if data exists
    if (!data || data.length === 0) {
        errors.push('No data found in file');
    }
    
    // Check for minimum required columns
    const requiredFields = [
        'Division',
        'MRF Date', 
        'Candidate\'s Status'
    ];
    
    requiredFields.forEach(field => {
        if (!headers.includes(field)) {
            errors.push(`Missing required column: ${field}`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        dataCount: data.length,
        headerCount: headers.length
    };
}

/**
 * Utility function to check if value has date or text content
 * @param {*} value - Value to check
 * @returns {boolean} True if value has content
 */
function hasDateOrText(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

/**
 * Show loading message
 * @param {string} message - Loading message to display
 */
function showLoading(message) {
    const statusElement = document.getElementById('uploadStatus');
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="loading">⏳ ${message}</div>
        `;
    }
}

/**
 * Hide loading message
 */
function hideLoading() {
    const statusElement = document.getElementById('uploadStatus');
    if (statusElement) {
        statusElement.innerHTML = '';
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const statusElement = document.getElementById('uploadStatus');
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="error-message">❌ ${message}</div>
        `;
    }
    
    // Hide results if showing
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

/**
 * Display file information
 * @param {number} totalRows - Total number of data rows
 * @param {number} totalColumns - Total number of columns
 */
function displayDataInfo(totalRows, totalColumns) {
    const dataInfoElement = document.getElementById('dataInfo');
    if (dataInfoElement) {
        dataInfoElement.innerHTML = `
            📊 Data loaded: <strong>${totalRows} candidates</strong>, <strong>${totalColumns} columns</strong>
        `;
    }
}