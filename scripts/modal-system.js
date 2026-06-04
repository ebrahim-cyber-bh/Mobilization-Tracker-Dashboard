/* ===================================
   RECRUITMENT TRACKER - MODAL SYSTEM
   Modal Management & Drill-Down Module (PHASE 3 - DESIGNATION COLUMN ADDED)
   =================================== */

// Global variables for modal state
let currentModalData = [];
let filteredModalData = [];
let currentModalPage = 1;
let modalPageSize = 20;
let currentStageName = '';
let currentPipelineType = '';

/**
 * Check if a field has valid date or text content
 * @param {string} value - The field value to check
 * @returns {boolean} True if field has content, false otherwise
 */
function hasDateOrText(value) {
    return value && value !== '' && value !== null && value !== undefined;
}

/**
 * Parse date from various formats (robust date parsing) - SHARED WITH CALCULATOR
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
 * Check if a candidate has arrived (arrival date <= today) - SHARED WITH CALCULATOR
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
 * Show pending candidates modal for a specific stage
 * @param {string} stageName - Name of the stage
 * @param {string} pipelineType - Type of pipeline (pre-mobilization or post-mobilization)  
 * @param {number} pendingCount - Number of pending candidates
 */
function showPendingModal(stageName, pipelineType, pendingCount) {
    console.log(`🔍 Opening modal for ${stageName} (${pipelineType}) - ${pendingCount} candidates`);
    
    // Store current stage info
    currentStageName = stageName;
    currentPipelineType = pipelineType;
    
    // Get candidates for this stage
    const candidates = getPendingCandidatesForStage(stageName, pipelineType);
    
    if (candidates.length === 0) {
        console.warn('⚠️ No candidates found for this stage');
        return;
    }
    
    // Set modal data
    currentModalData = candidates;
    filteredModalData = [...candidates];
    currentModalPage = 1;
    
    // Update modal UI
    const modal = document.getElementById('pendingModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (modalTitle) {
        modalTitle.textContent = `${stageName} - ${pendingCount} Pending`;
    }
    
    // Setup division filter
    setupDivisionFilter();
    
    // Setup event listeners
    setupModalEventListeners();
    
    // Update display
    updateModalDisplay();
    
    // Show modal
    if (modal) {
        modal.classList.add('show');
        
        // Add background click handler with proper event handling
        setTimeout(() => {
            modal.addEventListener('click', handleModalBackgroundClick);
        }, 100);
    }
    
    console.log(`✅ Modal opened with ${candidates.length} candidates`);
}

/**
 * Handle modal background clicks (fixed text selection issue)
 */
function handleModalBackgroundClick(event) {
    const modalContent = document.querySelector('.modal-content');
    
    // Only close if clicking outside modal content and not selecting text
    if (event.target === event.currentTarget && !modalContent.contains(event.target)) {
        closeModal();
    }
}

/**
 * Close modal on backdrop click - enhanced version
 */
function closeModalOnBackdrop(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

/**
 * Get pending candidates for a specific stage
 * @param {string} stageName - Name of the stage
 * @param {string} pipelineType - Type of pipeline
 * @returns {Array} Array of pending candidates with formatted data
 */
function getPendingCandidatesForStage(stageName, pipelineType) {
    console.log(`📊 Getting candidates for ${stageName} in ${pipelineType}`);
    
    // Use filtered data if filters are active, otherwise use all data
    const dataToUse = (typeof filteredCandidatesData !== 'undefined' && filteredCandidatesData.length < candidatesData.length) 
        ? filteredCandidatesData 
        : candidatesData;
    
    let candidates = [];
    
    if (pipelineType === 'pre-mobilization') {
        const stage = PRE_MOBILIZATION_STAGES.find(s => s.name === stageName);
        if (!stage) {
            console.error(`Pre-mobilization stage not found: ${stageName}`);
            return [];
        }
        
        const stageIndex = PRE_MOBILIZATION_STAGES.findIndex(s => s.name === stageName);
        
        if (stageIndex === 0) {
            // First stage: candidates with MRF Date but no current stage completion
            candidates = dataToUse.filter(candidate => {
                return candidate['Candidate\'s Status'] === 'Active' &&
                       hasDateOrText(candidate['MRF Date']) &&
                       !hasDateOrText(candidate[stage.field]);
            });
        } else if (stageName === 'Awaiting Mobilization') {
            // Special logic for mobilization - only arrived candidates
            const previousStage = PRE_MOBILIZATION_STAGES[stageIndex - 1];
            
            candidates = dataToUse.filter(candidate => {
                return candidate['Candidate\'s Status'] === 'Active' &&
                       hasDateOrText(candidate[previousStage.field]) &&
                       !hasDateOrText(candidate[stage.field]) &&
                       hasArrived(candidate); // Only candidates who have arrived
            });
        } else {
            // Other stages: standard sequential logic
            const previousStage = PRE_MOBILIZATION_STAGES[stageIndex - 1];
            
            candidates = dataToUse.filter(candidate => {
                return candidate['Candidate\'s Status'] === 'Active' &&
                       hasDateOrText(candidate[previousStage.field]) &&
                       !hasDateOrText(candidate[stage.field]);
            });
        }
    } else {
        // Post-mobilization stage
        const stage = POST_MOBILIZATION_STAGES.find(s => s.name === stageName);
        if (!stage) {
            console.error(`Stage not found: ${stageName}`);
            return [];
        }
        
        // Get Mobilized candidates pending for this stage
        candidates = dataToUse.filter(candidate => {
            return candidate['Candidate\'s Status'] === 'Mobilized' &&
                   hasDateOrText(candidate['Mobilized']) &&
                   !hasDateOrText(candidate[stage.field]);
        });
    }
    
    // Format candidate data for display (DESIGNATION COLUMN ADDED)
    const formattedCandidates = candidates.map(candidate => ({
        name: candidate['Name'] || 'N/A',
        passport: candidate['Passport No.'] || 'N/A',
        designation: candidate['Designations'] || 'N/A', // NEW: Added Designation field
        division: candidate['Division'] || 'N/A',
        project: candidate['Project'] || 'N/A',
        remarks: candidate['Remarks'] || 'N/A',
        rawCandidate: candidate // Keep original for days calculation
    }));
    
    // Add days calculation using the days calculator
    if (typeof calculateDaysForPendingCandidates === 'function') {
        return calculateDaysForPendingCandidates(formattedCandidates, stageName, pipelineType);
    } else {
        // Fallback if days calculator not available
        return formattedCandidates.map(candidate => ({
            ...candidate,
            daysInStage: 'N/A',
            daysColorClass: 'days-gray'
        }));
    }
}

/**
 * Setup division filter dropdown
 */
function setupDivisionFilter() {
    const divisionFilter = document.getElementById('divisionFilter');
    if (!divisionFilter) return;
    
    // Get unique divisions from current data
    const divisions = [...new Set(currentModalData.map(candidate => candidate.division))];
    divisions.sort();
    
    // Clear and populate filter
    divisionFilter.innerHTML = '<option value="">All Divisions</option>';
    divisions.forEach(division => {
        if (division && division !== 'N/A') {
            const option = document.createElement('option');
            option.value = division;
            option.textContent = division;
            divisionFilter.appendChild(option);
        }
    });
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyModalFilters);
    }
    
    // Division filter
    const divisionFilter = document.getElementById('divisionFilter');
    if (divisionFilter) {
        divisionFilter.addEventListener('change', applyModalFilters);
    }
}

/**
 * Apply search and filter to modal data
 */
function applyModalFilters() {
    const searchInput = document.getElementById('searchInput');
    const divisionFilter = document.getElementById('divisionFilter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedDivision = divisionFilter ? divisionFilter.value : '';
    
    let filtered = currentModalData;
    
    // Apply search filter (name or passport)
    if (searchTerm) {
        filtered = filtered.filter(candidate =>
            candidate.name.toLowerCase().includes(searchTerm) ||
            candidate.passport.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply division filter
    if (selectedDivision) {
        filtered = filtered.filter(candidate =>
            candidate.division === selectedDivision
        );
    }
    
    filteredModalData = filtered;
    currentModalPage = 1;
    updateModalDisplay();
}

/**
 * Update modal display with current page data (UPDATED FOR 7 COLUMNS WITH DESIGNATION)
 */
function updateModalDisplay() {
    const startIndex = (currentModalPage - 1) * modalPageSize;
    const endIndex = Math.min(startIndex + modalPageSize, filteredModalData.length);
    const currentData = filteredModalData.slice(startIndex, endIndex);
    
    // Update table (NOW 7 COLUMNS: Name, Passport, Designation, Division, Project, Remarks, Days)
    const tableBody = document.getElementById('pendingTableBody');
    if (tableBody) {
        if (currentData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>No candidates found</h3>
                        <p>No candidates match your current search criteria</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = currentData.map(candidate => `
                <tr>
                    <td><strong>${candidate.name}</strong></td>
                    <td>${candidate.passport}</td>
                    <td>${candidate.designation}</td>
                    <td>${candidate.division}</td>
                    <td>${candidate.project}</td>
                    <td>${candidate.remarks}</td>
                    <td class="${candidate.daysColorClass || 'days-gray'}">${candidate.daysInStage || 'N/A'}</td>
                </tr>
            `).join('');
        }
    }
    
    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        if (filteredModalData.length === 0) {
            paginationInfo.textContent = 'No results found';
        } else {
            paginationInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredModalData.length} results`;
        }
    }
    
    // Update pagination controls
    const totalPages = Math.ceil(filteredModalData.length / modalPageSize);
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.disabled = currentModalPage <= 1;
    if (nextBtn) nextBtn.disabled = currentModalPage >= totalPages;
    
    // Update page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    if (pageNumbers) {
        let pagesHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            pagesHTML += `<button class="page-btn ${i === currentModalPage ? 'active' : ''}" onclick="goToModalPage(${i})">${i}</button>`;
        }
        
        pageNumbers.innerHTML = pagesHTML;
    }
}

/**
 * Change modal page by direction
 * @param {number} direction - -1 for previous, 1 for next
 */
function changePage(direction) {
    const totalPages = Math.ceil(filteredModalData.length / modalPageSize);
    currentModalPage = Math.max(1, Math.min(totalPages, currentModalPage + direction));
    updateModalDisplay();
}

/**
 * Go to specific modal page
 * @param {number} page - Page number to go to
 */
function goToModalPage(page) {
    currentModalPage = page;
    updateModalDisplay();
}

/**
 * Change modal page size
 */
function changePageSize() {
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        modalPageSize = parseInt(pageSizeSelect.value);
        currentModalPage = 1;
        updateModalDisplay();
    }
}

/**
 * Export pending candidates data to CSV (UPDATED WITH DESIGNATION COLUMN)
 */
function exportPendingData() {
    if (filteredModalData.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Updated CSV header and content - Designation column added
    const csvContent = 'Name,Passport,Designation,Division,Project,Remarks,Days in Stage\n' +
        filteredModalData.map(candidate => 
            `"${candidate.name}","${candidate.passport}","${candidate.designation}","${candidate.division}","${candidate.project}","${candidate.remarks}","${candidate.daysInStage || 'N/A'}"`
        ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pending_candidates.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('📥 CSV exported successfully (Designation column included)');
}

/**
 * Close the modal
 */
function closeModal() {
    const modal = document.getElementById('pendingModal');
    if (modal) {
        modal.classList.remove('show');
        
        // Remove event listener to prevent memory leaks
        modal.removeEventListener('click', handleModalBackgroundClick);
        
        // Clear data
        currentModalData = [];
        filteredModalData = [];
        currentModalPage = 1;
        currentStageName = '';
        currentPipelineType = '';
        
        // Clear search inputs
        const searchInput = document.getElementById('searchInput');
        const divisionFilter = document.getElementById('divisionFilter');
        
        if (searchInput) searchInput.value = '';
        if (divisionFilter) divisionFilter.value = '';
    }
}
    