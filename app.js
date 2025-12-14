// ViralCast - Frontend Application Logic
// Handles data fetching, visualization, and UI updates

const API_BASE_URL = 'https://viralcast-prediction-gp1.onrender.com/api';

let trajectoryChart = null;
let lastCustomData = null; // Store last custom input for persistence

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('ViralCast Dashboard Initializing...');
    initializeChart();
    
    // Check if user has entered custom location before
    const hasCustomLocation = localStorage.getItem('hasCustomLocation');
    
    if (!hasCustomLocation) {
        // First time user - require location input
        setTimeout(() => {
            openInputModal();
            showWelcomeMessage();
        }, 500);
    } else {
        // Load default data
        loadDashboardData();
    }
});

// Initialize trajectory chart
function initializeChart() {
    const ctx = document.getElementById('trajectoryChart').getContext('2d');
    
    trajectoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Projected Cases',
                data: [],
                borderColor: '#4a90e2',
                backgroundColor: createGradient(ctx),
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4a90e2',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 22, 40, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Cases: ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Create gradient for chart
function createGradient(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(74, 144, 226, 0.3)');
    gradient.addColorStop(1, 'rgba(74, 144, 226, 0.0)');
    return gradient;
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Load current stats
        await loadCurrentStats();
        
        // Load predictions
        await loadPredictions();
        
        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Please ensure the API server is running.');
    }
}

// Load current statistics
async function loadCurrentStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/current-stats`);
        if (!response.ok) throw new Error('Failed to fetch current stats');
        
        const data = await response.json();
        
        // Update stats panel
        document.getElementById('weeklyCases').textContent = formatNumber(data.weekly_cases);
        document.getElementById('casesDate').textContent = `week ending ${data.date}`;
        
        document.getElementById('hospitalizations').textContent = formatNumber(data.hospitalizations);
        document.getElementById('hospDate').textContent = `week ending ${data.date}`;
        
        document.getElementById('variant').textContent = data.variant;
        document.getElementById('variantDate').textContent = `week ending ${data.date}`;
        
    } catch (error) {
        console.error('Error loading current stats:', error);
    }
}

// Load predictions and update trajectory
async function loadPredictions() {
    try {
        const response = await fetch(`${API_BASE_URL}/predict`);
        if (!response.ok) throw new Error('Failed to fetch predictions');
        
        const data = await response.json();
        
        // Update trajectory chart
        updateTrajectoryChart(data.historical, data.predictions);
        
        // Update risk level
        updateRiskLevel(data.risk_assessment);
        
        // Update trend badge
        updateTrendBadge(data.trend);
        
        // Update executive summary with prediction insights
        updateExecutiveSummary(data);
        
    } catch (error) {
        console.error('Error loading predictions:', error);
    }
}

// Update trajectory chart with data
function updateTrajectoryChart(historical, predictions) {
    const labels = [];
    const values = [];
    
    // Add last 4 weeks of historical data
    const recentHistory = historical.slice(-4);
    recentHistory.forEach(point => {
        labels.push(formatDate(point.date));
        values.push(point.value);
    });
    
    // Add predictions
    predictions.forEach(point => {
        labels.push(formatDate(point.date));
        values.push(point.value);
    });
    
    trajectoryChart.data.labels = labels;
    trajectoryChart.data.datasets[0].data = values;
    trajectoryChart.update('active');
}

// Update risk level display
function updateRiskLevel(assessment) {
    const riskElement = document.getElementById('riskLevel');
    riskElement.textContent = assessment.level;
    riskElement.className = `risk-level ${assessment.level.toLowerCase()}`;
    
    // Update icon based on risk
    const iconElement = document.querySelector('.risk-icon');
    if (assessment.level === 'Low') {
        iconElement.textContent = '✅';
    } else if (assessment.level === 'Moderate') {
        iconElement.textContent = '⚠️';
    } else {
        iconElement.textContent = '🔴';
    }
}

// Update trend badge
function updateTrendBadge(trend) {
    const badge = document.getElementById('trendBadge');
    badge.textContent = trend;
    
    // Update badge color based on trend
    if (trend === 'Increasing') {
        badge.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else if (trend === 'Decreasing') {
        badge.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else {
        badge.style.background = 'linear-gradient(135deg, #4a90e2 0%, #06b6d4 100%)';
    }
}

// Update executive summary
function updateExecutiveSummary(data) {
    const summaryElement = document.getElementById('executiveSummary');
    const avgPrediction = data.predictions.reduce((sum, p) => sum + p.value, 0) / data.predictions.length;
    const currentCases = data.historical[data.historical.length - 1].value;
    const changePercent = ((avgPrediction - currentCases) / currentCases * 100).toFixed(1);
    
    let trendText = 'stable';
    if (changePercent > 10) trendText = 'increasing';
    else if (changePercent < -10) trendText = 'decreasing';
    
    summaryElement.textContent = `The COVID-19 situation in Japan is currently assessed at a ${data.risk_assessment.level.toLowerCase()} risk level with a ${trendText} trend. National data shows ${formatNumber(currentCases)} weekly cases, with projections suggesting ${changePercent > 0 ? 'a slight increase' : changePercent < 0 ? 'a slight decrease' : 'stability'} over the next week. The healthcare system is anticipated to manage the current burden effectively.`;
}

// Refresh data
async function refreshData() {
    console.log('Refreshing dashboard data...');
    const button = document.querySelector('.btn-primary');
    button.textContent = 'Analyzing...';
    button.disabled = true;
    
    await loadDashboardData();
    
    button.textContent = 'Analyze';
    button.disabled = false;
}

// Utility: Format number with commas
function formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    return Math.round(num).toLocaleString();
}

// Utility: Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// Utility: Show error message
function showError(message) {
    console.error(message);
    // You could add a toast notification here
    alert(message);
}

// Auto-refresh every 5 minutes
setInterval(() => {
    console.log('Auto-refreshing data...');
    loadDashboardData();
}, 5 * 60 * 1000);

// ============================================================================
// CUSTOM INPUT MODAL FUNCTIONS
// ============================================================================

let customLocationData = null;

// Open input modal
function openInputModal() {
    document.getElementById('inputModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Restore previous values if they exist
    if (lastCustomData) {
        restoreFormValues(lastCustomData);
    }
}

// Close input modal
function closeInputModal() {
    document.getElementById('inputModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    // Don't reset form - keep values for next time
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('inputModal');
    if (event.target === modal) {
        closeInputModal();
    }
}

// Show welcome message for first-time users
function showWelcomeMessage() {
    const modalBody = document.querySelector('.modal-body');
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = `
        <p style="color: var(--accent-blue); font-weight: 600; margin-bottom: 1rem;">
            👋 Welcome to ViralCast!
        </p>
        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">
            To get started, please enter your location and current COVID-19 parameters below.
        </p>
    `;
    modalBody.insertBefore(welcomeDiv, modalBody.firstChild);
}

// Reset form (only used when explicitly needed)
function resetForm() {
    document.getElementById('customInputForm').reset();
    document.getElementById('locationValidation').className = 'validation-message';
    document.getElementById('locationValidation').textContent = '';
    customLocationData = null;
    
    // Reset slider displays
    document.getElementById('stringencyValue').textContent = '50';
    document.getElementById('mobilityValue').textContent = '0%';
    document.getElementById('vaccinationValue').textContent = '50%';
}

// Restore form values from previous submission
function restoreFormValues(data) {
    document.getElementById('locationInput').value = data.location;
    document.getElementById('casesInput').value = data.previousWeekCases;
    
    if (data.hospitalizations) {
        document.getElementById('hospitalizationsInput').value = data.hospitalizations;
    }
    
    document.getElementById('stringencyInput').value = data.stringencyIndex;
    document.getElementById('mobilityInput').value = data.mobility;
    document.getElementById('vaccinationInput').value = data.vaccinationRate;
    
    if (data.populationDensity) {
        document.getElementById('densityInput').value = data.populationDensity;
    }
    
    // Update slider displays
    updateSliderValue('stringency', data.stringencyIndex);
    updateSliderValue('mobility', data.mobility);
    updateSliderValue('vaccination', data.vaccinationRate);
    
    // Restore location data
    customLocationData = data.locationData;
    
    // Show validation success
    if (customLocationData) {
        const validationDiv = document.getElementById('locationValidation');
        validationDiv.className = 'validation-message success';
        validationDiv.textContent = `✓ Valid location: ${customLocationData.name} (${customLocationData.region})`;
    }
}

// Update slider value display
function updateSliderValue(type, value) {
    const numValue = parseFloat(value);
    
    switch(type) {
        case 'stringency':
            document.getElementById('stringencyValue').textContent = Math.round(numValue);
            break;
        case 'mobility':
            const sign = numValue >= 0 ? '+' : '';
            document.getElementById('mobilityValue').textContent = `${sign}${Math.round(numValue)}%`;
            break;
        case 'vaccination':
            document.getElementById('vaccinationValue').textContent = `${Math.round(numValue)}%`;
            break;
    }
}

// Validate location using REST Countries API
async function validateLocation(location) {
    const validationDiv = document.getElementById('locationValidation');
    validationDiv.className = 'validation-message';
    validationDiv.textContent = 'Validating location...';
    
    try {
        // Try to find the country/region
        const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(location)}`);
        
        if (!response.ok) {
            throw new Error('Location not found');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const country = data[0];
            customLocationData = {
                name: country.name.common,
                officialName: country.name.official,
                population: country.population,
                region: country.region,
                subregion: country.subregion
            };
            
            validationDiv.className = 'validation-message success';
            validationDiv.textContent = `✓ Valid location: ${customLocationData.name} (${customLocationData.region})`;
            return true;
        }
    } catch (error) {
        validationDiv.className = 'validation-message error';
        validationDiv.textContent = '✗ Location not found. Please enter a valid country or region name.';
        customLocationData = null;
        return false;
    }
}

// Debounce location validation
let locationValidationTimeout;
document.addEventListener('DOMContentLoaded', () => {
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.addEventListener('input', (e) => {
            clearTimeout(locationValidationTimeout);
            if (e.target.value.length >= 3) {
                locationValidationTimeout = setTimeout(() => {
                    validateLocation(e.target.value);
                }, 500);
            } else {
                document.getElementById('locationValidation').className = 'validation-message';
                document.getElementById('locationValidation').textContent = '';
            }
        });
    }
});

// Handle custom input form submission
async function handleCustomInput(event) {
    event.preventDefault();
    
    // Validate location first
    const location = document.getElementById('locationInput').value;
    const isValid = await validateLocation(location);
    
    if (!isValid) {
        alert('Please enter a valid location before generating predictions.');
        return;
    }
    
    // Gather all input data
    const customData = {
        location: customLocationData.name,
        locationData: customLocationData,
        previousWeekCases: parseInt(document.getElementById('casesInput').value),
        hospitalizations: document.getElementById('hospitalizationsInput').value ? 
            parseInt(document.getElementById('hospitalizationsInput').value) : null,
        stringencyIndex: parseInt(document.getElementById('stringencyInput').value),
        mobility: parseInt(document.getElementById('mobilityInput').value),
        vaccinationRate: parseInt(document.getElementById('vaccinationInput').value),
        populationDensity: document.getElementById('densityInput').value ? 
            parseInt(document.getElementById('densityInput').value) : null
    };
    
    console.log('Custom input data:', customData);
    
    // Save for persistence
    lastCustomData = customData;
    localStorage.setItem('hasCustomLocation', 'true');
    
    // Close modal
    closeInputModal();
    
    // Show loading state
    showLoadingState();
    
    // Generate prediction with custom data
    await generateCustomPrediction(customData);
}

// Show loading state
function showLoadingState() {
    document.getElementById('riskLevel').textContent = 'Analyzing...';
    document.getElementById('weeklyCases').textContent = 'Loading...';
    document.getElementById('hospitalizations').textContent = 'Loading...';
}

// Generate prediction with custom data
async function generateCustomPrediction(customData) {
    try {
        const response = await fetch(`${API_BASE_URL}/predict-custom`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate custom prediction');
        }
        
        const data = await response.json();
        
        // Update UI with custom prediction
        updateUIWithCustomPrediction(data, customData);
        
        // Update executive summary
        updateCustomExecutiveSummary(data, customData);
        
    } catch (error) {
        console.error('Error generating custom prediction:', error);
        alert('Failed to generate prediction. Please try again or check your inputs.');
        loadDashboardData(); // Fallback to default data
    }
}

// Update UI with custom prediction
function updateUIWithCustomPrediction(data, customData) {
    // Update location display in header
    document.querySelector('.logo-text p').textContent = `Real-time Analysis for ${customData.location}`;
    
    // Update stat labels to show custom location consistently
    const statLabels = document.querySelectorAll('.stat-label');
    
    // First stat - Weekly cases
    statLabels[0].textContent = `Weekly Airborne Disease Cases (${customData.location})`;
    document.getElementById('weeklyCases').textContent = formatNumber(customData.previousWeekCases);
    document.getElementById('casesDate').textContent = 'user input';
    
    // Second stat - Hospitalizations
    statLabels[1].textContent = `Disease-Related Hospitalizations (${customData.location})`;
    if (customData.hospitalizations) {
        document.getElementById('hospitalizations').textContent = formatNumber(customData.hospitalizations);
        document.getElementById('hospDate').textContent = 'user input';
    } else {
        document.getElementById('hospitalizations').textContent = 'N/A';
        document.getElementById('hospDate').textContent = 'not provided';
    }
    
    // Third stat - Predicted Cases Change
    const predictedCases = data.predictions[0].value;
    const changePercent = ((predictedCases - customData.previousWeekCases) / customData.previousWeekCases * 100);
    const changeAbs = Math.abs(changePercent).toFixed(1);
    
    statLabels[2].textContent = `Predicted Cases Change`;
    
    let changeDisplay, changeColor;
    if (changePercent > 5) {
        changeDisplay = `↑ ${changeAbs}%`;
        changeColor = 'var(--status-high)';
    } else if (changePercent < -5) {
        changeDisplay = `↓ ${changeAbs}%`;
        changeColor = 'var(--status-low)';
    } else {
        changeDisplay = `→ ${changeAbs}%`;
        changeColor = 'var(--status-moderate)';
    }
    
    const predictedChangeElement = document.getElementById('predictedChange');
    predictedChangeElement.textContent = changeDisplay;
    predictedChangeElement.style.color = changeColor;
    document.getElementById('changeDate').textContent = `next week forecast`;
    
    // Update trajectory chart
    updateTrajectoryChart(data.historical, data.predictions);
    
    // Update risk level
    updateRiskLevel(data.risk_assessment);
    
    // Update trend badge
    updateTrendBadge(data.trend);
}

// Update executive summary for custom prediction
function updateCustomExecutiveSummary(data, customData) {
    const summaryElement = document.getElementById('executiveSummary');
    const predictedCases = data.predictions[0].value;
    const changePercent = ((predictedCases - customData.previousWeekCases) / customData.previousWeekCases * 100);
    
    // Determine trend with more nuanced thresholds
    let trendText = 'stable';
    let trendDescription = 'stability';
    if (changePercent > 5) {
        trendText = 'increasing';
        trendDescription = `a ${Math.abs(changePercent).toFixed(1)}% increase`;
    } else if (changePercent < -5) {
        trendText = 'decreasing';
        trendDescription = `a ${Math.abs(changePercent).toFixed(1)}% decrease`;
    } else {
        trendDescription = 'relative stability';
    }
    
    summaryElement.textContent = `The airborne disease situation in ${customData.location} is currently assessed at a ${data.risk_assessment.level.toLowerCase()} risk level with a ${trendText} trend. Based on ${formatNumber(customData.previousWeekCases)} weekly cases, stringency index of ${customData.stringencyIndex}, mobility at ${customData.mobility}%, and ${customData.vaccinationRate}% vaccination rate, projections suggest ${trendDescription} over the next week.`;
    
    // Update outlook with accurate percentage
    const outlookElement = document.getElementById('outlookText');
    const changeDirection = changePercent > 0 ? 'increase' : changePercent < 0 ? 'decrease' : 'remain stable';
    const absChange = Math.abs(changePercent).toFixed(1);
    
    outlookElement.innerHTML = `<em>"Based on the current parameters for ${customData.location}, the model predicts approximately ${formatNumber(Math.round(predictedCases))} cases for the upcoming week. This represents a ${absChange}% ${changeDirection} from the previous week. The stringency index of ${customData.stringencyIndex}, mobility level of ${customData.mobility > 0 ? '+' : ''}${customData.mobility}%, and vaccination rate of ${customData.vaccinationRate}% are key factors influencing this prediction."</em>`;
    
    // Update Key Drivers cards dynamically
    updateKeyDrivers(customData);
}

// Update Key Drivers cards based on user parameters
function updateKeyDrivers(customData) {
    // Driver 1: Vaccination
    const vacRate = customData.vaccinationRate;
    let vac1Title, vac1Desc, vac1Icon;
    
    if (vacRate >= 70) {
        vac1Title = 'HIGH VACCINATION COVERAGE';
        vac1Desc = `With ${vacRate}% vaccination rate in ${customData.location}, the population has strong immunity protection, significantly reducing severe outcomes and transmission.`;
        vac1Icon = '💉';
    } else if (vacRate >= 40) {
        vac1Title = 'MODERATE VACCINATION COVERAGE';
        vac1Desc = `${customData.location} has achieved ${vacRate}% vaccination coverage, providing partial population immunity but leaving room for improvement.`;
        vac1Icon = '💉';
    } else {
        vac1Title = 'LOW VACCINATION COVERAGE';
        vac1Desc = `With only ${vacRate}% vaccination rate, ${customData.location} faces higher risk of severe outcomes and continued transmission.`;
        vac1Icon = '⚠️';
    }
    
    document.getElementById('driver1Title').textContent = vac1Title;
    document.getElementById('driver1Desc').textContent = vac1Desc;
    document.getElementById('driver1Icon').textContent = vac1Icon;
    
    // Driver 2: Stringency
    const stringency = customData.stringencyIndex;
    let str2Title, str2Desc, str2Icon;
    
    if (stringency >= 70) {
        str2Title = 'STRICT GOVERNMENT MEASURES';
        str2Desc = `${customData.location} has implemented strict restrictions (stringency: ${stringency}/100), significantly limiting social interactions and transmission opportunities.`;
        str2Icon = '🔒';
    } else if (stringency >= 30) {
        str2Title = 'MODERATE RESTRICTIONS';
        str2Desc = `Government response in ${customData.location} maintains moderate measures (stringency: ${stringency}/100), balancing public health with economic activity.`;
        str2Icon = '⚖️';
    } else {
        str2Title = 'MINIMAL RESTRICTIONS';
        str2Desc = `${customData.location} has relaxed most public health measures (stringency: ${stringency}/100), prioritizing personal responsibility and economic recovery.`;
        str2Icon = '🔓';
    }
    
    document.getElementById('driver2Title').textContent = str2Title;
    document.getElementById('driver2Desc').textContent = str2Desc;
    document.getElementById('driver2Icon').textContent = str2Icon;
    
    // Driver 3: Mobility
    const mobility = customData.mobility;
    let mob3Title, mob3Desc, mob3Icon;
    
    if (mobility >= 20) {
        mob3Title = 'ELEVATED MOBILITY';
        mob3Desc = `Population movement in ${customData.location} is ${mobility}% above baseline, increasing transmission opportunities through higher social interactions.`;
        mob3Icon = '🚶‍♂️';
    } else if (mobility >= -20) {
        mob3Title = 'NORMAL MOBILITY PATTERNS';
        mob3Desc = `${customData.location} shows near-baseline mobility (${mobility > 0 ? '+' : ''}${mobility}%), with typical levels of social interaction and movement.`;
        mob3Icon = '🚶';
    } else {
        mob3Title = 'REDUCED MOBILITY';
        mob3Desc = `Movement in ${customData.location} is ${Math.abs(mobility)}% below baseline, significantly reducing transmission opportunities through limited social contact.`;
        mob3Icon = '🏠';
    }
    
    document.getElementById('driver3Title').textContent = mob3Title;
    document.getElementById('driver3Desc').textContent = mob3Desc;
    document.getElementById('driver3Icon').textContent = mob3Icon;
}


