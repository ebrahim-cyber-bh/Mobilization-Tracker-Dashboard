/* ===================================
   RECRUITMENT TRACKER - TARGET CONFIGURATION
   Target Days Configuration Module
   =================================== */

/**
 * Target days configuration for each stage
 * Easy to modify for different business rules
 */
const TARGET_DAYS_CONFIG = {
    // Pre-Mobilization Stages (Sequential)
    'Evaluation Received': 5,           // MRF → Evaluation: 5 days
    'Job Accepted': 3,                  // Evaluation → Job Accepted: 3 days
    'Visa documents received': 3,       // Job Accepted → Visa Documents: 3 days
    'Visa Applied': 3,                  // Visa Documents → Visa Applied: 3 days
    'Visa Issued': 25,                  // Visa Applied → Visa Issued: 25 days
    'Bah Arrival Date': 3,              // Visa Issued → Arrival: 3 days
    'Mobilized': 2,                     // Arrival → Mobilization: 2 days
    
    // Post-Mobilization Stages (Parallel - all from Mobilized date)
    'LMRA Enrollment': 1,               // Mobilized → LMRA Enrollment: 1 day
    'CPR': 3,                           // Mobilized → CPR Issuance: 3 days
    'LMRA Medical': 2,                  // Mobilized → LMRA Medical: 2 days
    'Health Card': 1,                   // Mobilized → Health Card: 1 day
    'Company ID CARD': 1,               // Mobilized → Company ID: 1 day
    'Gate Pass': 1                      // Mobilized → Gate Pass: 1 day
};

/**
 * Get target days for a specific stage
 * @param {string} stageField - The field name of the stage
 * @returns {number} Target days for the stage
 */
function getTargetDays(stageField) {
    return TARGET_DAYS_CONFIG[stageField] || 0;
}

/**
 * Get all target days configuration
 * @returns {Object} Complete target days configuration
 */
function getAllTargetDays() {
    return { ...TARGET_DAYS_CONFIG };
}

/**
 * Update target days for a specific stage
 * @param {string} stageField - The field name of the stage
 * @param {number} days - New target days
 */
function updateTargetDays(stageField, days) {
    if (TARGET_DAYS_CONFIG.hasOwnProperty(stageField)) {
        TARGET_DAYS_CONFIG[stageField] = days;
        console.log(`✅ Updated target days for ${stageField}: ${days} days`);
    } else {
        console.warn(`⚠️ Stage field not found: ${stageField}`);
    }
}

/**
 * Reset target days to default values
 */
function resetTargetDays() {
    // Reset to original values
    Object.assign(TARGET_DAYS_CONFIG, {
        'Evaluation Received': 5,
        'Job Accepted': 3,
        'Visa documents received': 3,
        'Visa Applied': 3,
        'Visa Issued': 25,
        'Bah Arrival Date': 3,
        'Mobilized': 2,
        'LMRA Enrollment': 1,
        'CPR': 3,
        'LMRA Medical': 2,
        'Health Card': 1,
        'Company ID CARD': 1,
        'Gate Pass': 1
    });
    console.log('✅ Target days reset to default values');
}

/**
 * Validate target days configuration
 * @returns {boolean} True if configuration is valid
 */
function validateTargetDays() {
    const errors = [];
    
    for (const [stage, days] of Object.entries(TARGET_DAYS_CONFIG)) {
        if (typeof days !== 'number' || days < 0) {
            errors.push(`Invalid target days for ${stage}: ${days}`);
        }
    }
    
    if (errors.length > 0) {
        console.error('❌ Target days configuration errors:', errors);
        return false;
    }
    
    console.log('✅ Target days configuration is valid');
    return true;
}

// Export functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TARGET_DAYS_CONFIG,
        getTargetDays,
        getAllTargetDays,
        updateTargetDays,
        resetTargetDays,
        validateTargetDays
    };
}