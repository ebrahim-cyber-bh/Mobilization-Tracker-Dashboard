/* ===================================
   TWO-LEVEL FILTER MANAGEMENT (MRF FILTER REMOVED)
   =================================== */

// Global filter state (MRF REFERENCE REMOVED)
let currentFilters = {
    division: 'all',
    project: 'all'
};

let filteredCandidatesData = [];

/**
 * Initialize two-level filter system
 */
function initializeFilterSystem() {
    console.log('🔍 Initializing two-level filter system...');
    
    // Check if we have data first
    if (!candidatesData || candidatesData.length === 0) {
        console.warn('⚠️ No candidates data available for filters');
        return;
    }
    
    // Show filter controls
    const filterControls = document.getElementById('filterControls');
    if (filterControls) {
        console.log('📋 Found filter controls element, making visible...');
        filterControls.classList.remove('hidden');
        filterControls.style.display = 'block'; // Force display
        console.log('✅ Filter controls should now be visible');
    } else {
        console.error('❌ Filter controls element not found!');
        return;
    }
    
    // Populate initial filter options
    populateDivisionFilter();
    
    // Add event listeners
    setupFilterEventListeners();
    
    // Set initial filtered data
    filteredCandidatesData = [...candidatesData];
    
    console.log('✅ Filter system initialized with', candidatesData.length, 'candidates');
}

/**
 * Manual function to show filters (for debugging)
 */
function showFilters() {
    console.log('🔍 Manual filter show triggered...');
    const filterControls = document.getElementById('filterControls');
    if (filterControls) {
        filterControls.classList.remove('hidden');
        filterControls.style.display = 'block';
        console.log('✅ Filters manually shown');
    } else {
        console.error('❌ Filter controls not found');
    }
}

/**
 * Setup filter event listeners (MRF FILTER REMOVED)
 */
function setupFilterEventListeners() {
    const divisionFilter = document.getElementById('divisionFilterMain');
    const projectFilter = document.getElementById('projectFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    if (divisionFilter) {
        divisionFilter.addEventListener('change', handleDivisionFilterChange);
    }
    
    if (projectFilter) {
        projectFilter.addEventListener('change', handleProjectFilterChange);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

/**
 * Populate division filter dropdown
 */
function populateDivisionFilter() {
    const divisionFilter = document.getElementById('divisionFilterMain');
    if (!divisionFilter || !candidatesData) return;
    
    // Get unique divisions
    const divisions = [...new Set(candidatesData
        .map(candidate => candidate['Division'])
        .filter(div => div && div.trim() !== '')
    )].sort();
    
    // Clear and populate
    divisionFilter.innerHTML = '<option value="all">All Divisions</option>';
    
    divisions.forEach(division => {
        const option = document.createElement('option');
        option.value = division;
        option.textContent = division;
        divisionFilter.appendChild(option);
    });
    
    console.log(`📋 Populated ${divisions.length} divisions`);
}

/**
 * Populate project filter based on selected division
 */
function populateProjectFilter(selectedDivision) {
    const projectFilter = document.getElementById('projectFilter');
    if (!projectFilter || !candidatesData) return;
    
    let relevantCandidates = candidatesData;
    
    // Filter by division if not "all"
    if (selectedDivision !== 'all') {
        relevantCandidates = candidatesData.filter(candidate => 
            candidate['Division'] === selectedDivision
        );
    }
    
    // Get unique projects
    const projects = [...new Set(relevantCandidates
        .map(candidate => candidate['Project'])
        .filter(proj => proj && proj.trim() !== '')
    )].sort();
    
    // Clear and populate
    projectFilter.innerHTML = '<option value="all">All Projects</option>';
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        projectFilter.appendChild(option);
    });
    
    console.log(`📋 Populated ${projects.length} projects for division: ${selectedDivision}`);
}

/**
 * Handle division filter change
 */
function handleDivisionFilterChange(event) {
    const selectedDivision = event.target.value;
    console.log(`🔍 Division filter changed to: ${selectedDivision}`);
    
    // Update filter state (MRF REFERENCE REMOVED)
    currentFilters.division = selectedDivision;
    currentFilters.project = 'all';
    
    // Reset dependent filter
    document.getElementById('projectFilter').value = 'all';
    
    // Populate project filter based on new division
    populateProjectFilter(selectedDivision);
    
    // Apply filters and update display
    applyFiltersAndUpdate();
}

/**
 * Handle project filter change
 */
function handleProjectFilterChange(event) {
    const selectedProject = event.target.value;
    console.log(`🔍 Project filter changed to: ${selectedProject}`);
    
    // Update filter state
    currentFilters.project = selectedProject;
    
    // Apply filters and update display
    applyFiltersAndUpdate();
}

/**
 * Apply current filters to data and update all displays (MRF LOGIC REMOVED)
 */
function applyFiltersAndUpdate() {
    console.log('🔄 Applying filters and updating displays...');
    
    // Filter the data (MRF MATCHING REMOVED)
    filteredCandidatesData = candidatesData.filter(candidate => {
        const divisionMatch = currentFilters.division === 'all' || 
                            candidate['Division'] === currentFilters.division;
        
        const projectMatch = currentFilters.project === 'all' || 
                           candidate['Project'] === currentFilters.project;
        
        return divisionMatch && projectMatch;
    });
    
    console.log(`📊 Filtered data: ${filteredCandidatesData.length} of ${candidatesData.length} candidates`);
    
    // Update filter status
    updateFilterStatus();
    
    // Recalculate and display with filtered data
    calculateAndDisplayFiltered();
}

/**
 * Update filter status display (MRF REFERENCE REMOVED)
 */
function updateFilterStatus() {
    const filterStatus = document.getElementById('filterStatus');
    if (!filterStatus) return;
    
    const totalCandidates = candidatesData.length;
    const filteredCount = filteredCandidatesData.length;
    
    if (currentFilters.division === 'all' && 
        currentFilters.project === 'all') {
        
        filterStatus.textContent = `Showing all ${totalCandidates} candidates`;
        filterStatus.classList.remove('active');
    } else {
        let statusText = `Showing ${filteredCount} of ${totalCandidates} candidates`;
        
        if (currentFilters.division !== 'all') {
            statusText += ` | Division: ${currentFilters.division}`;
        }
        if (currentFilters.project !== 'all') {
            statusText += ` | Project: ${currentFilters.project}`;
        }
        
        filterStatus.textContent = statusText;
        filterStatus.classList.add('active');
    }
}

/**
 * Clear all filters and reset to "all" (MRF FILTER REMOVED)
 */
function clearAllFilters() {
    console.log('🔄 Clearing all filters...');
    
    // Reset filter state (MRF REFERENCE REMOVED)
    currentFilters = {
        division: 'all',
        project: 'all'
    };
    
    // Reset dropdowns
    document.getElementById('divisionFilterMain').value = 'all';
    document.getElementById('projectFilter').value = 'all';
    
    // Repopulate filters
    populateProjectFilter('all');
    
    // Reset filtered data
    filteredCandidatesData = [...candidatesData];
    
    // Update displays
    updateFilterStatus();
    calculateAndDisplayFiltered();
}

/**
 * Calculate and display with filtered data
 */
function calculateAndDisplayFiltered() {
    console.log('🎯 Calculating with filtered data...');
    
    try {
        // Calculate all metrics with filtered data
        const overview = calculateOverviewMetrics(filteredCandidatesData);
        const preMobilization = calculatePreMobilizationPipeline(filteredCandidatesData);
        const postMobilization = calculatePostMobilizationPipeline(filteredCandidatesData);
        
        // Display results
        displayOverviewMetrics(overview);
        displayPipelineGrid('preMobilizationGrid', preMobilization);
        displayPipelineGrid('postMobilizationGrid', postMobilization);
        
        console.log('✅ Filtered calculations and display complete!');
        
    } catch (error) {
        console.error('❌ Error in filtered calculations:', error);
        showError('Error calculating metrics: ' + error.message);
    }
}