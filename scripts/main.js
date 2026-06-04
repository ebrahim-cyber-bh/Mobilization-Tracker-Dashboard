/* ===================================
   RECRUITMENT TRACKER - MAIN COORDINATION
   Application Initialization & Coordination Module
   =================================== */

/**
 * Main application initialization
 * Coordinates all modules and ensures proper startup sequence
 */
function initializeApplication() {
    console.log('🎯 Recruitment Tracker Dashboard Initializing...');
    
    try {
        // Initialize file upload functionality
        if (typeof initializeFileUpload === 'function') {
            initializeFileUpload();
            console.log('✅ File upload system initialized');
        } else {
            console.error('❌ File upload initialization function not found');
        }
        
        // Initialize dashboard display
        if (typeof initializeDashboard === 'function') {
            initializeDashboard();
            console.log('✅ Dashboard display initialized');
        } else {
            console.error('❌ Dashboard initialization function not found');
        }
        
        console.log('🎉 Application initialization complete!');
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
    }
}

/**
 * Coordinate data processing after file upload
 * @param {Array} data - Processed candidate data
 */
function coordinateDataProcessing(data) {
    console.log('🔄 Coordinating data processing...');
    
    try {
        // Store data globally
        if (typeof candidatesData !== 'undefined') {
            candidatesData = data;
        } else {
            window.candidatesData = data;
        }
        
        // Initialize filter system if data is available
        if (data && data.length > 0) {
            if (typeof initializeFilterSystem === 'function') {
                // Add delay to ensure DOM is ready
                setTimeout(() => {
                    initializeFilterSystem();
                    console.log('✅ Filter system initialized with data');
                }, 100);
            }
        }
        
        // Calculate and display initial results
        if (typeof calculateAndDisplay === 'function') {
            calculateAndDisplay();
            console.log('✅ Initial calculations and display complete');
        }
        
    } catch (error) {
        console.error('❌ Data processing coordination failed:', error);
    }
}

/**
 * Coordinate filtered data updates
 * Called when filters change to update all related displays
 */
function coordinateFilteredUpdates() {
    console.log('🔄 Coordinating filtered updates...');
    
    try {
        // This function is called by the filter system
        // It ensures all displays are updated consistently
        if (typeof calculateAndDisplayFiltered === 'function') {
            calculateAndDisplayFiltered();
        }
        
    } catch (error) {
        console.error('❌ Filtered updates coordination failed:', error);
    }
}

/**
 * Global error handler for the application
 * @param {string} message - Error message
 * @param {Error} error - Error object (optional)
 */
function handleApplicationError(message, error = null) {
    console.error('🚨 Application Error:', message);
    if (error) {
        console.error('Error details:', error);
    }
    
    // Show user-friendly error message
    if (typeof showError === 'function') {
        showError(message);
    } else {
        alert('An error occurred: ' + message);
    }
}

/**
 * Check system dependencies
 * Ensures all required functions and variables are available
 */
function checkDependencies() {
    const requiredFunctions = [
        'initializeFileUpload',
        'calculateAndDisplay',
        'calculateOverviewMetrics',
        'calculatePreMobilizationPipeline',
        'calculatePostMobilizationPipeline',
        'displayOverviewMetrics',
        'displayPipelineGrid'
    ];
    
    const missingFunctions = [];
    
    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            missingFunctions.push(funcName);
        }
    });
    
    if (missingFunctions.length > 0) {
        console.warn('⚠️ Missing required functions:', missingFunctions);
        return false;
    }
    
    console.log('✅ All dependencies available');
    return true;
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM loaded, starting application...');
    
    // Check dependencies first
    if (checkDependencies()) {
        initializeApplication();
    } else {
        handleApplicationError('Missing required dependencies. Please check console for details.');
    }
});

// Global error handling
window.addEventListener('error', function(event) {
    handleApplicationError('JavaScript error occurred', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    handleApplicationError('Promise rejection occurred', event.reason);
});

// Export coordination functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApplication,
        coordinateDataProcessing,
        coordinateFilteredUpdates,
        handleApplicationError,
        checkDependencies
    };
}