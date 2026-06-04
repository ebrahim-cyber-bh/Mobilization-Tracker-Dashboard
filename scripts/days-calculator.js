/* ===================================
   RECRUITMENT TRACKER - DAYS CALCULATOR
   Days in Stage Calculation with Excel Date Support
   =================================== */

/**
 * ROBUST DATE PARSING - Based on working old system approach
 * Handles Excel serial numbers, DD-MMM-YY, and other formats
 */

/**
 * Parse date from multiple formats including Excel serial numbers
 * @param {*} dateValue - Date value in various formats
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseRobustDate(dateValue) {
    if (!dateValue) return null;
    
    const trimmed = dateValue.toString().trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'n/a' || trimmed === '-') {
        return null;
    }
    
    try {
        // Handle Excel serial numbers (like 45762)
        if (/^\d+$/.test(trimmed)) {
            const serialNumber = parseInt(trimmed);
            // 🔧 FIX 1: Excel epoch correction for leap year bug
            if (serialNumber > 1 && serialNumber < 100000) {
                // Excel has a leap year bug - use December 30, 1899 as epoch
                const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
                const date = new Date(excelEpoch.getTime() + serialNumber * 24 * 60 * 60 * 1000);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        
        // Handle DD-MMM-YY format (e.g., "15-Jan-25")
        const ddMmmYy = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
        if (ddMmmYy) {
            const day = parseInt(ddMmmYy[1]);
            const monthAbbr = ddMmmYy[2].toLowerCase();
            const year = 2000 + parseInt(ddMmmYy[3]); // Convert YY to YYYY
            
            const monthMap = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            
            const month = monthMap[monthAbbr];
            if (month !== undefined) {
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        
        // Handle DD/MM/YYYY format
        const ddMmYyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddMmYyyy) {
            const day = parseInt(ddMmYyyy[1]);
            const month = parseInt(ddMmYyyy[2]) - 1;
            const year = parseInt(ddMmYyyy[3]);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Fallback to standard Date parsing
        const parsed = new Date(trimmed);
        return isNaN(parsed.getTime()) ? null : parsed;
        
    } catch (error) {
        console.warn('⚠️ Date parsing error for value:', dateValue, error);
        return null;
    }
}

/**
 * Calculate days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (defaults to today)
 * @returns {number} Number of calendar days
 */
function calculateDaysBetween(startDate, endDate = new Date()) {
    if (!startDate || isNaN(startDate.getTime())) {
        return 0;
    }
    
    // 🔧 FIX 2: Calculate days excluding the start date
    // Set both dates to midnight to avoid time zone issues
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const diffTime = endMidnight.getTime() - startMidnight.getTime();
    const daysDifference = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 🔧 BUSINESS LOGIC ADJUSTMENT: Subtract 1 to match business expectation
    // This gives us the working days logic user expects
    return Math.max(0, daysDifference - 1);
}

/**
 * Calculate days for Pre-Mobilization stages (sequential)
 * @param {Object} candidate - Candidate data
 * @param {string} stageName - Current stage name
 * @returns {Object} Days calculation result
 */
function calculatePreMobilizationDays(candidate, stageName) {
    const stageMapping = {
        'Awaiting Evaluation': { current: 'Evaluation Received', previous: null },
        'Awaiting Job Acceptance': { current: 'Job Accepted', previous: 'Evaluation Received' },
        'Awaiting Visa Documents': { current: 'Visa documents received', previous: 'Job Accepted' },
        'Awaiting Visa Application': { current: 'Visa Applied', previous: 'Visa documents received' },
        'Awaiting Visa Issuance': { current: 'Visa Issued', previous: 'Visa Applied' },
        'Awaiting Arrival': { current: 'Bah Arrival Date', previous: 'Visa Issued' },
        'Awaiting Mobilization': { current: 'Mobilized', previous: 'Bah Arrival Date' }
    };
    
    const stageInfo = stageMapping[stageName];
    if (!stageInfo) {
        return { days: 0, isValid: false, reason: 'Unknown stage' };
    }
    
    // 🔧 FIX: For sequential calculation, use the previous stage completion date
    // But handle first stage (Awaiting Evaluation) specially
    let referenceFieldName;
    
    if (stageName === 'Awaiting Evaluation') {
        // First stage uses MRF Date as reference
        referenceFieldName = 'MRF Date';
    } else {
        // All other stages use the previous completed stage
        referenceFieldName = stageInfo.previous;
    }
    
    const referenceValue = candidate[referenceFieldName];
    
    if (!referenceValue) {
        return { days: 0, isValid: false, reason: `No ${referenceFieldName} date` };
    }
    
    const referenceDate = parseRobustDate(referenceValue);
    if (!referenceDate) {
        return { days: 0, isValid: false, reason: `Invalid ${referenceFieldName} date format` };
    }
    
    const today = new Date();
    const daysInStage = calculateDaysBetween(referenceDate, today);
    
    return { 
        days: daysInStage, 
        isValid: true, 
        referenceDate: referenceDate,
        referenceField: referenceFieldName
    };
}

/**
 * Calculate days for Post-Mobilization stages (parallel from mobilization)
 * @param {Object} candidate - Candidate data
 * @param {string} stageName - Current stage name
 * @returns {Object} Days calculation result
 */
function calculatePostMobilizationDays(candidate, stageName) {
    // All post-mobilization stages calculate from mobilization date
    const mobilizedValue = candidate['Mobilized'];
    if (!mobilizedValue) {
        return { days: 0, isValid: false, reason: 'No Mobilized date' };
    }
    
    const mobilizedDate = parseRobustDate(mobilizedValue);
    if (!mobilizedDate) {
        return { days: 0, isValid: false, reason: 'Invalid Mobilized date format' };
    }
    
    const today = new Date();
    const daysInStage = calculateDaysBetween(mobilizedDate, today);
    
    return { 
        days: daysInStage, 
        isValid: true, 
        referenceDate: mobilizedDate,
        referenceField: 'Mobilized'
    };
}

/**
 * Main function to calculate days in stage for a candidate
 * @param {Object} candidate - Candidate data
 * @param {string} stageName - Current stage name
 * @param {string} pipelineType - 'pre-mobilization' or 'post-mobilization'
 * @returns {Object} Days calculation result with color classification
 */
function calculateDaysInStage(candidate, stageName, pipelineType) {
    let calculation;
    
    if (pipelineType === 'pre-mobilization') {
        calculation = calculatePreMobilizationDays(candidate, stageName);
    } else if (pipelineType === 'post-mobilization') {
        calculation = calculatePostMobilizationDays(candidate, stageName);
    } else {
        return {
            daysInStage: 'N/A',
            daysColorClass: 'days-gray',
            daysRaw: 0,
            targetDays: 0,
            isOnTime: false,
            isOverdue: false,
            debugInfo: 'Unknown pipeline type'
        };
    }
    
    if (!calculation.isValid) {
        return {
            daysInStage: 'N/A',
            daysColorClass: 'days-gray',
            daysRaw: 0,
            targetDays: 0,
            isOnTime: false,
            isOverdue: false,
            debugInfo: calculation.reason
        };
    }
    
    // Get target days from configuration
    const targetDays = getTargetDaysForStage(stageName, pipelineType);
    const actualDays = calculation.days;
    
    // Determine status and color
    const isOnTime = actualDays <= targetDays;
    const isOverdue = actualDays > targetDays;
    
    return {
        daysInStage: `${actualDays} day${actualDays === 1 ? '' : 's'}`,
        daysColorClass: isOnTime ? 'days-green' : 'days-red',
        daysRaw: actualDays,
        targetDays: targetDays,
        isOnTime: isOnTime,
        isOverdue: isOverdue,
        debugInfo: `${actualDays}/${targetDays} days from ${calculation.referenceField}`
    };
}

/**
 * Get target days for a specific stage
 * @param {string} stageName - Stage name
 * @param {string} pipelineType - Pipeline type
 * @returns {number} Target days
 */
function getTargetDaysForStage(stageName, pipelineType) {
    // Map display names to field names for target config lookup
    const stageToFieldMapping = {
        // Pre-mobilization stages (v1.7 "Awaiting" terminology)
        'Awaiting Evaluation': 'Evaluation Received',
        'Awaiting Job Acceptance': 'Job Accepted', 
        'Awaiting Visa Documents': 'Visa documents received',
        'Awaiting Visa Applied': 'Visa Applied',
        'Awaiting Visa Issued': 'Visa Issued',
        'Awaiting Arrival': 'Bah Arrival Date',
        'Awaiting Mobilization': 'Mobilized',
        // Post-mobilization stages (v1.7 "Awaiting" terminology)
        'Awaiting Health Card': 'Health Card',
        'Awaiting Company ID': 'Company ID CARD',
        'Awaiting LMRA Enrollment': 'LMRA Enrollment',
        'Awaiting CPR Processing': 'CPR',
        'Awaiting Medical Checkup': 'LMRA Medical',
        'Awaiting Gate Pass': 'Gate Pass'
    };
    
    const fieldName = stageToFieldMapping[stageName] || stageName;
    
    if (typeof TARGET_DAYS_CONFIG !== 'undefined') {
        return TARGET_DAYS_CONFIG[fieldName] || 0;
    }
    
    // Fallback target days if config not available (v1.7 "Awaiting" terminology)
    const fallbackTargets = {
        'Awaiting Evaluation': 5,
        'Awaiting Job Acceptance': 3,
        'Awaiting Visa Documents': 3,
        'Awaiting Visa Applied': 3,
        'Awaiting Visa Issued': 25,
        'Awaiting Arrival': 3,
        'Awaiting Mobilization': 2,
        'Awaiting Health Card': 1,
        'Awaiting Company ID': 1,
        'Awaiting LMRA Enrollment': 1,
        'Awaiting CPR Processing': 3,
        'Awaiting Medical Checkup': 2,
        'Awaiting Gate Pass': 1
    };
    
    return fallbackTargets[stageName] || 1;
}

/**
 * Calculate days for all pending candidates in a specific stage
 * @param {Array} candidates - Array of pending candidates
 * @param {string} stageName - Stage name
 * @param {string} pipelineType - Pipeline type
 * @returns {Array} Candidates with days calculation added
 */
function calculateDaysForPendingCandidates(candidates, stageName, pipelineType) {
    console.log(`🧮 Days Calculator: Processing ${candidates.length} candidates for ${stageName} (${pipelineType})`);
    
    return candidates.map(candidate => {
        const daysCalculation = calculateDaysInStage(candidate.rawCandidate, stageName, pipelineType);
        
        // Add debug logging for first candidate
        if (candidate === candidates[0]) {
            console.log('📊 Sample days calculation:', {
                candidate: candidate.name,
                stage: stageName,
                pipeline: pipelineType,
                result: daysCalculation
            });
        }
        
        return {
            ...candidate,
            daysInStage: daysCalculation.daysInStage,
            daysColorClass: daysCalculation.daysColorClass,
            daysRaw: daysCalculation.daysRaw,
            targetDays: daysCalculation.targetDays,
            isOnTime: daysCalculation.isOnTime,
            isOverdue: daysCalculation.isOverdue,
            debugInfo: daysCalculation.debugInfo
        };
    });
}

// Make functions globally available
window.calculateDaysForPendingCandidates = calculateDaysForPendingCandidates;
window.calculateDaysInStage = calculateDaysInStage;
window.parseRobustDate = parseRobustDate;