/* ===================================
   RECRUITMENT TRACKER - DASHBOARD DISPLAY
   Display & Animation Functions Module (UPDATED - PENDING REMOVED)
   =================================== */

/**
 * Display overview metrics with counter animations
 * @param {Object} overview - Overview metrics object
 */
function displayOverviewMetrics(overview) {
    console.log('📊 Displaying overview metrics...');
    
    const container = document.getElementById('overviewGrid');
    if (!container) {
        console.error('❌ Overview grid container not found');
        return;
    }
    
    // UPDATED ORDER: Total, Active, Mobilized, Hold, Inactive, Archive, Completed (PENDING REMOVED)
    const metrics = [
        { value: overview.total, label: 'Total', id: 'total' },
        { value: overview.active, label: 'Active', id: 'active' },
        { value: overview.mobilized, label: 'Mobilized', id: 'mobilized' },
        { value: overview.hold, label: 'Hold', id: 'hold' },
        { value: overview.inactive, label: 'Inactive', id: 'inactive' },
        { value: overview.archive, label: 'Archive', id: 'archive' },
        { value: overview.completed, label: 'Completed', id: 'completed' }
    ];
    
    // Generate HTML for metric cards
    container.innerHTML = metrics.map(metric => `
        <div class="metric-card stagger-item">
            <div class="metric-number counter-animation" id="counter-${metric.id}">${metric.value}</div>
            <div class="metric-label">${metric.label}</div>
        </div>
    `).join('');
    
    // Animate counters with staggered effect
    setTimeout(() => {
        metrics.forEach((metric, index) => {
            setTimeout(() => {
                animateCounter(document.getElementById(`counter-${metric.id}`), metric.value);
            }, index * 100); // Stagger by 100ms
        });
    }, 100);
    
    console.log('✅ Overview metrics displayed');
}

/**
 * Display pipeline stages in grid format with click handlers
 * @param {string} containerId - ID of container element
 * @param {Array} stages - Array of stage data
 */
function displayPipelineGrid(containerId, stages) {
    console.log(`🎯 Displaying pipeline grid: ${containerId}`);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Pipeline container not found: ${containerId}`);
        return;
    }
    
    // Determine pipeline type from container ID
    const pipelineType = containerId.includes('pre') ? 'pre-mobilization' : 'post-mobilization';
    
    // Generate HTML for stage cards with click handlers
    container.innerHTML = stages.map((stage, index) => `
        <div class="pipeline-stage-card ${stage.colorGroup} stagger-item ${stage.pending > 0 ? 'clickable-card' : ''}" 
             style="animation-delay: ${index * 0.1}s"
             ${stage.pending > 0 ? `onclick="showPendingModal('${stage.name}', '${pipelineType}', ${stage.pending})"` : ''}
             ${stage.pending > 0 ? 'title="Click to view pending candidates"' : ''}>
            <div class="pipeline-stage-number counter-animation" id="pipeline-${containerId}-${index}">${stage.pending}</div>
            <div class="pipeline-stage-name">${stage.name}</div>
        </div>
    `).join('');
    
    // Add cursor pointer style for clickable cards
    const clickableCards = container.querySelectorAll('.clickable-card');
    clickableCards.forEach(card => {
        card.style.cursor = 'pointer';
    });
    
    // Animate counters
    setTimeout(() => {
        stages.forEach((stage, index) => {
            const element = document.getElementById(`pipeline-${containerId}-${index}`);
            if (element) {
                animateCounter(element, stage.pending);
            }
        });
    }, 200);
    
    console.log(`✅ Pipeline grid displayed: ${containerId}`);
}

/**
 * Animate counter from 0 to target value
 * @param {HTMLElement} element - Element to animate
 * @param {number} target - Target number
 */
function animateCounter(element, target) {
    if (!element || target === 0) {
        if (element) element.textContent = target;
        return;
    }
    
    let current = 0;
    const increment = target / 60; // 1 second animation (60fps)
    const duration = Math.min(1500, Math.max(500, target * 50)); // Dynamic duration
    const steps = Math.floor(duration / 16); // 60fps
    const stepIncrement = target / steps;
    
    element.classList.add('counting');
    element.textContent = '0';
    
    const timer = setInterval(() => {
        current += stepIncrement;
        if (current >= target) {
            element.textContent = target;
            element.classList.remove('counting');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16); // ~60fps
}

/**
 * Initialize dashboard animations and interactions
 */
function initializeDashboard() {
    console.log('🎨 Initializing dashboard...');
    
    // Add keyboard support for modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    console.log('✅ Dashboard initialized');
}

/**
 * Update dashboard with new data
 * @param {Array} newData - New candidate data
 */
function updateDashboard(newData) {
    console.log('🔄 Updating dashboard with new data...');
    
    // Update global data
    if (typeof candidatesData !== 'undefined') {
        candidatesData = newData;
    }
    
    // Recalculate and display
    calculateAndDisplay();
    
    console.log('✅ Dashboard updated');
}

/**
 * Clear dashboard and reset to initial state
 */
function clearDashboard() {
    console.log('🧹 Clearing dashboard...');
    
    // Clear results
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    // Clear upload status
    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) {
        uploadStatus.innerHTML = '';
    }
    
    // Reset file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    console.log('✅ Dashboard cleared');
}

/**
 * Show dashboard loading state
 */
function showDashboardLoading() {
    const containers = ['overviewGrid', 'preMobilizationGrid', 'postMobilizationGrid'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-skeleton"></div>
                <div class="loading-skeleton"></div>
                <div class="loading-skeleton"></div>
            `;
        }
    });
}

/**
 * Apply theme or styling updates
 * @param {Object} theme - Theme configuration
 */
function applyTheme(theme) {
    if (!theme) return;
    
    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    
    // Add keyboard support for modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

// Export functions for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        displayOverviewMetrics,
        displayPipelineGrid,
        animateCounter,
        initializeDashboard,
        updateDashboard,
        clearDashboard,
        showDashboardLoading,
        applyTheme
    };
}