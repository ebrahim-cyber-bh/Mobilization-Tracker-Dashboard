/* ===================================
   RECRUITMENT TRACKER - BUSINESS LOGIC
   Core Calculation Functions Module (UPDATED - HIRED & INTERNAL TRANSFER ADDED)
   =================================== */

// Stage configuration
const PRE_MOBILIZATION_STAGES = [
    { name: 'Awaiting Evaluation', field: 'Evaluation Received', colorGroup: 'stage-group-1' },
    { name: 'Awaiting Job Acceptance', field: 'Job Accepted', colorGroup: 'stage-group-1' },
    { name: 'Awaiting Visa Documents', field: 'Visa documents received', colorGroup: 'stage-group-2' },
    { name: 'Awaiting Visa Application', field: 'Visa Applied', colorGroup: 'stage-group-2' },
    { name: 'Awaiting Visa Issuance', field: 'Visa Issued', colorGroup: 'stage-group-2' },
    { name: 'Awaiting Arrival', field: 'Bah Arrival Date', colorGroup: 'stage-group-3' },
    { name: 'Awaiting Mobilization', field: 'Mobilized', colorGroup: 'stage-group-3' }
];

const POST_MOBILIZATION_STAGES = [
    { name: 'Awaiting LMRA Enrollment', field: 'LMRA Enrollment', colorGroup: 'stage-group-4' },
    { name: 'Awaiting CPR Processing', field: 'CPR', colorGroup: 'stage-group-4' },
    { name: 'Awaiting Medical Checkup', field: 'LMRA Medical', colorGroup: 'stage-group-4' },
    { name: 'Awaiting Health Card', field: 'Health Card', colorGroup: 'stage-group-5' },
    { name: 'Awaiting Company ID', field: 'Company ID CARD', colorGroup: 'stage-group-5' },
    { name: 'Awaiting Gate Pass', field: 'Gate Pass', colorGroup: 'stage-group-5' }
];

/**
 * Check if a field has valid date or text content
 * @param {string} value - The field value to check
 * @returns {boolean} True if field has content, false otherwise
 */
function hasDateOrText(value) {
    return value && value !== '' && value !== null && value !== undefined;
}

/**
 * Parse date from various formats (robust date parsing)
 * @param {string|number} dateValue - Date value in various formats
 * @returns {Date|null} Parsed date object or null if invalid
 */
function parseRobustDate(dateValue) {
    if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
        return null;
    }
    
    // If already a Date object
    if (dateValue instanceof Date) {
        return dateValue;
    }
    
    // Convert to string for processing
    let dateStr = String(dateValue).trim();
    
    // Handle Excel serial numbers (like 45762)
    if (/^\d{5}$/.test(dateStr)) {
        const excelDate = parseInt(dateStr);
        // Excel epoch starts from January 1, 1900 (with leap year bug correction)
        const excelEpoch = new Date(1900, 0, 1);
        const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
        return jsDate;
    }
    
    // Handle dd-mmm-yy format (like "30-Oct-24")
    const ddMmmYyRegex = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/;
    const match = dateStr.match(ddMmmYyRegex);
    if (match) {
        const [, day, monthStr, year] = match;
        const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const monthIndex = monthMap[monthStr];
        if (monthIndex !== undefined) {
            const fullYear = 2000 + parseInt(year);
            return new Date(fullYear, monthIndex, parseInt(day));
        }
    }
    
    // Try standard JavaScript Date parsing
    const jsDate = new Date(dateStr);
    if (!isNaN(jsDate.getTime())) {
        return jsDate;
    }
    
    return null;
}

/**
 * Check if a candidate has arrived (arrival date <= today)
 * @param {Object} candidate - Candidate data object
 * @returns {boolean} True if candidate has arrived, false otherwise
 */
function hasArrived(candidate) {
    const arrivalDate = parseRobustDate(candidate['Bah Arrival Date']);
    if (!arrivalDate) {
        return false; // No arrival date means not arrived
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today for comparison
    
    return arrivalDate <= today;
}

/**
 * Calculate Hired candidates (NEW FUNCTION)
 * Mobilized candidates where Recruitment Type = "Replacement" OR "New"
 * @param {Array} candidates - Array of candidate data  
 * @returns {number} Count of hired candidates
 */
function calculateHired(candidates = candidatesData) {
    console.log('🎯 Calculating Hired candidates...');
    
    if (!candidates || candidates.length === 0) {
        console.warn('⚠️ No candidates data available for Hired calculation');
        return 0;
    }
    
    const hired = candidates.filter(candidate => {
        const isMobilized = candidate['Candidate\'s Status'] === 'Mobilized';
        const recruitmentType = candidate['Recruitment Type'];
        const isHiredType = recruitmentType === 'Replacement' || recruitmentType === 'New';
        
        return isMobilized && isHiredType;
    }).length;
    
    console.log(`✅ Hired candidates calculated: ${hired}`);
    return hired;
}

/**
 * Calculate Internal Transfer candidates (NEW FUNCTION)
 * Mobilized candidates where Recruitment Type = "Internal Transfer"
 * @param {Array} candidates - Array of candidate data  
 * @returns {number} Count of internal transfer candidates
 */
function calculateInternalTransfer(candidates = candidatesData) {
    console.log('🔄 Calculating Internal Transfer candidates...');
    
    if (!candidates || candidates.length === 0) {
        console.warn('⚠️ No candidates data available for Internal Transfer calculation');
        return 0;
    }
    
    const internalTransfer = candidates.filter(candidate => {
        const isMobilized = candidate['Candidate\'s Status'] === 'Mobilized';
        const recruitmentType = candidate['Recruitment Type'];
        const isInternalTransfer = recruitmentType === 'Internal Transfer';
        
        return isMobilized && isInternalTransfer;
    }).length;
    
    console.log(`✅ Internal Transfer candidates calculated: ${internalTransfer}`);
    return internalTransfer;
}

/**
 * Calculate overview metrics (UPDATED - HIRED & INTERNAL TRANSFER ADDED)
 * @param {Array} candidates - Array of candidate data  
 * @returns {Object} Overview metrics object
 */
function calculateOverviewMetrics(candidates = candidatesData) {
    console.log('📊 Calculating overview metrics...');
    
    if (!candidates || candidates.length === 0) {
        console.warn('⚠️ No candidates data available for overview calculation');
        return {
            total: 0, active: 0, mobilized: 0, hold: 0, 
            inactive: 0, archive: 0, completed: 0, hired: 0, internalTransfer: 0
        };
    }
    
    // Count by status
    const total = candidates.length;
    const active = candidates.filter(c => c['Candidate\'s Status'] === 'Active').length;
    const mobilized = candidates.filter(c => c['Candidate\'s Status'] === 'Mobilized').length;
    const hold = candidates.filter(c => c['Candidate\'s Status'] === 'Hold').length;
    const inactive = candidates.filter(c => c['Candidate\'s Status'] === 'Inactive').length;
    const archive = candidates.filter(c => c['Candidate\'s Status'] === 'Archive').length;
    
    // Calculate completed (exclude Archive)
    const nonArchiveCandidates = candidates.filter(c => c['Candidate\'s Status'] !== 'Archive');
    const completed = calculateFullyCompleted(nonArchiveCandidates);
    
    // NEW: Calculate Hired and Internal Transfer (ensure they're always numbers)
    const hired = calculateHired(candidates) || 0;
    const internalTransfer = calculateInternalTransfer(candidates) || 0;
    
    const overview = {
        total, active, mobilized, hold, inactive, archive, completed, hired, internalTransfer
    };
    
    console.log('✅ Overview metrics calculated:', overview);
    return overview;
}

/**
 * Calculate fully completed candidates (all 13 stages done)
 * @param {Array} candidates - Array of candidate data
 * @returns {number} Count of fully completed candidates
 */
function calculateFullyCompleted(candidates) {
    return candidates.filter(candidate => {
        // Check all 7 pre-mobilization stages
        const allPreCompleted = PRE_MOBILIZATION_STAGES.every(stage => 
            hasDateOrText(candidate[stage.field])
        );
        
        // Check all 6 post-mobilization stages  
        const allPostCompleted = POST_MOBILIZATION_STAGES.every(stage => 
            hasDateOrText(candidate[stage.field])
        );
        
        return (allPreCompleted && allPostCompleted);
    }).length;
}

/**
 * Calculate Pre-Mobilization pipeline metrics - WITH ARRIVAL LOGIC
 * @param {Array} candidates - Array of candidate data
 * @returns {Array} Array of stage metrics
 */
function calculatePreMobilizationPipeline(candidates = candidatesData) {
    console.log('📄 Calculating Pre-Mobilization pipeline...');
    const results = [];
    
    // UPDATED: Start from first stage (MRF Date removed)
    PRE_MOBILIZATION_STAGES.forEach((stage, index) => {
        // Only ACTIVE candidates for pending
        const activeCandidates = candidates.filter(c => 
            c['Candidate\'s Status'] === 'Active'
        );
        
        let pending = 0;
        
        if (index === 0) {
            // First stage: Awaiting Evaluation
            // Pending = Active candidates with MRF Date but no Evaluation
            pending = activeCandidates.filter(candidate => {
                const hasMRF = hasDateOrText(candidate['MRF Date']);
                const hasEvaluation = hasDateOrText(candidate[stage.field]);
                return hasMRF && !hasEvaluation;
            }).length;
        } else if (stage.name === 'Awaiting Mobilization') {
            // 🚀 SPECIAL LOGIC: Awaiting Mobilization - Only arrived candidates
            console.log('🛡️ Applying arrival logic for Awaiting Mobilization...');
            
            const previousStage = PRE_MOBILIZATION_STAGES[index - 1];
            
            pending = activeCandidates.filter(candidate => {
                const prevCompleted = hasDateOrText(candidate[previousStage.field]);
                const currentCompleted = hasDateOrText(candidate[stage.field]);
                const arrived = hasArrived(candidate);
                
                // Only count as pending if: previous stage done, current not done, AND already arrived
                return prevCompleted && !currentCompleted && arrived;
            }).length;
            
            console.log(`🛡️ Mobilization pending (arrived only): ${pending}`);
        } else {
            // Other stages - standard logic
            const previousStage = PRE_MOBILIZATION_STAGES[index - 1];
            
            pending = activeCandidates.filter(candidate => {
                const prevCompleted = hasDateOrText(candidate[previousStage.field]);
                const currentCompleted = hasDateOrText(candidate[stage.field]);
                return prevCompleted && !currentCompleted;
            }).length;
        }
        
        // Completed includes Active + Mobilized
        const eligibleForCompleted = candidates.filter(c => 
            c['Candidate\'s Status'] === 'Active' || c['Candidate\'s Status'] === 'Mobilized'
        );
        
        const completed = eligibleForCompleted.filter(candidate => 
            hasDateOrText(candidate[stage.field])
        ).length;
        
        results.push({
            name: stage.name,
            pending: pending,
            completed: completed,
            colorGroup: stage.colorGroup
        });
    });
    
    console.log('✅ Pre-Mobilization pipeline calculated (with arrival logic)');
    return results;
}

/**
 * Calculate Post-Mobilization pipeline metrics - UPDATED FOR GATE PASS
 * @param {Array} candidates - Array of candidate data
 * @returns {Array} Array of stage metrics
 */
function calculatePostMobilizationPipeline(candidates = candidatesData) {
    console.log('⚡ Calculating Post-Mobilization pipeline...');
    const results = [];
    
    // Only mobilized candidates are eligible
    const mobilizedCandidates = candidates.filter(candidate => 
        candidate['Candidate\'s Status'] === 'Mobilized' && 
        hasDateOrText(candidate['Mobilized'])
    );
    
    console.log('📊 Mobilized candidates eligible:', mobilizedCandidates.length);
    
    POST_MOBILIZATION_STAGES.forEach(stage => {
        const completed = mobilizedCandidates.filter(candidate => 
            hasDateOrText(candidate[stage.field])
        ).length;
        
        const pending = mobilizedCandidates.length - completed;
        
        results.push({
            name: stage.name,
            pending: pending,
            completed: completed,
            colorGroup: stage.colorGroup
        });
    });
    
    console.log('✅ Post-Mobilization pipeline calculated (including Gate Pass)');
    return results;
}

/**
 * Main calculation and display function
 * Orchestrates all calculations and updates the UI
 */
function calculateAndDisplay() {
    console.log('🎯 Starting calculations and display...');
    
    try {
        // Calculate all metrics
        const overview = calculateOverviewMetrics();
        const preMobilization = calculatePreMobilizationPipeline();
        const postMobilization = calculatePostMobilizationPipeline();
        
        // Display results
        displayOverviewMetrics(overview);
        displayPipelineGrid('preMobilizationGrid', preMobilization);
        displayPipelineGrid('postMobilizationGrid', postMobilization);
        
        console.log('🎉 All calculations and display complete!');
        
    } catch (error) {
        console.error('❌ Error in calculations:', error);
        showError('Error calculating metrics: ' + error.message);
    }
}

// Export functions for use by other modules (UPDATED - NEW FUNCTIONS ADDED)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRE_MOBILIZATION_STAGES,
        POST_MOBILIZATION_STAGES,
        calculateOverviewMetrics,
        calculateFullyCompleted,
        calculateHired,
        calculateInternalTransfer,
        calculatePreMobilizationPipeline,
        calculatePostMobilizationPipeline,
        calculateAndDisplay,
        hasArrived,
        parseRobustDate
    };
}