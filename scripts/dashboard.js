/* ===================================
   RECRUITMENT TRACKER - DASHBOARD (UPDATED)
   Remaining functions after module extraction
   =================================== */

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
        
        // Initialize filter system if not already done
        if (typeof initializeFilterSystem === 'function') {
            setTimeout(() => {
                initializeFilterSystem();
            }, 200);
        }
        
        console.log('🎉 All calculations and display complete!');
        
    } catch (error) {
        console.error('❌ Error in calculations:', error);
        showError('Error calculating metrics: ' + error.message);
    }
}

// Export functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateAndDisplay
    };
}