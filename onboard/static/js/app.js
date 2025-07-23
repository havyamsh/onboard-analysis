// Application State
let currentView = 'home';
let onboardingData = [];
let currentSession = null;
let insights = [];

// Step Configuration
const STEPS = [
    { id: 1, name: 'Sign Up', icon: 'fas fa-user', description: 'Create your account' },
    { id: 2, name: 'Email Verification', icon: 'fas fa-envelope', description: 'Verify your email address' },
    { id: 3, name: 'Profile Setup', icon: 'fas fa-cog', description: 'Complete your profile' },
    { id: 4, name: 'Upload ID', icon: 'fas fa-upload', description: 'Upload identification' },
    { id: 5, name: 'Payment', icon: 'fas fa-credit-card', description: 'Add payment method' }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    setupEventListeners();
    updateStats();
    showView('home');
});

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.closest('.nav-btn').dataset.view;
            showView(view);
        });
    });

    // Hero actions
    document.querySelector('[data-action="start-simulation"]').addEventListener('click', () => {
        showView('simulator');
    });

    document.querySelector('[data-action="view-analytics"]').addEventListener('click', () => {
        showView('analytics');
    });

    // Quick actions
    document.getElementById('generate-insights').addEventListener('click', generateInsights);
    document.getElementById('reset-data').addEventListener('click', resetData);
    document.getElementById('analytics-generate-insights').addEventListener('click', generateInsights);
}

// View Management
function showView(viewName) {
    currentView = viewName;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Initialize view-specific content
    if (viewName === 'simulator') {
        initializeSimulator();
    } else if (viewName === 'analytics') {
        initializeAnalytics();
    }
}

// Data Management
function loadStoredData() {
    const stored = localStorage.getItem('onboarding-data');
    if (stored) {
        onboardingData = JSON.parse(stored);
    }
    
    const storedInsights = localStorage.getItem('ai-insights');
    if (storedInsights) {
        insights = JSON.parse(storedInsights);
        if (insights.length > 0) {
            displayInsights(insights);
        }
    }
}

function saveData() {
    localStorage.setItem('onboarding-data', JSON.stringify(onboardingData));
    localStorage.setItem('ai-insights', JSON.stringify(insights));
}

function resetData() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        onboardingData = [];
        insights = [];
        localStorage.removeItem('onboarding-data');
        localStorage.removeItem('ai-insights');
        updateStats();
        hideInsights();
        
        // Show success message
        showNotification('Data reset successfully!', 'success');
    }
}

// Statistics Update
function updateStats() {
    const totalSessions = onboardingData.length;
    const totalDropoffs = onboardingData.filter(d => d.dropOffStep !== null).length;
    const totalInsights = insights.length;
    
    document.getElementById('total-sessions').textContent = totalSessions;
    document.getElementById('total-dropoffs').textContent = totalDropoffs;
    document.getElementById('total-insights').textContent = totalInsights;
    
    // Update analytics view if active
    if (currentView === 'analytics') {
        updateAnalyticsStats();
    }
    
    // Enable/disable insights button
    const insightsBtn = document.getElementById('generate-insights');
    insightsBtn.disabled = totalSessions === 0;
}

// Simulator Functions
function initializeSimulator() {
    startNewSession();
}

function startNewSession() {
    currentSession = {
        userId: `user_${Date.now()}`,
        currentStep: 1,
        steps: STEPS.map(step => ({
            stepNumber: step.id,
            stepName: step.name,
            completed: false
        })),
        startTime: new Date().toISOString()
    };
    
    document.getElementById('current-user-id').textContent = currentSession.userId;
    updateSimulatorDisplay();
}

function updateSimulatorDisplay() {
    updateProgressBar();
    updateStepsOverview();
    updateStepCard();
}

function updateProgressBar() {
    const progress = ((currentSession.currentStep - 1) / STEPS.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

function updateStepsOverview() {
    const container = document.getElementById('steps-overview');
    container.innerHTML = '';
    
    STEPS.forEach((step, index) => {
        const isCompleted = currentSession.steps[index]?.completed;
        const isCurrent = step.id === currentSession.currentStep;
        
        const stepElement = document.createElement('div');
        stepElement.className = `step-item ${isCurrent ? 'current' : ''}`;
        
        const circleClass = isCompleted ? 'completed' : isCurrent ? 'current' : 'pending';
        const icon = isCompleted ? 'fas fa-check' : step.icon;
        
        stepElement.innerHTML = `
            <div class="step-circle ${circleClass}">
                <i class="${icon}"></i>
            </div>
            <span class="step-name">${step.name}</span>
        `;
        
        container.appendChild(stepElement);
    });
}

function updateStepCard() {
    const container = document.getElementById('step-card');
    
    if (currentSession.currentStep > STEPS.length) {
        // Show completion card
        container.innerHTML = `
            <div class="success-card">
                <div class="success-icon">
                    <i class="fas fa-check"></i>
                </div>
                <h3 class="success-title">Onboarding Complete!</h3>
                <p class="success-description">User has successfully completed the entire onboarding process.</p>
                <button class="btn btn-primary" onclick="startNewSession()">
                    <i class="fas fa-redo"></i>
                    Start New Session
                </button>
            </div>
        `;
        return;
    }
    
    const currentStepData = STEPS[currentSession.currentStep - 1];
    
    container.innerHTML = `
        <div class="step-icon">
            <i class="${currentStepData.icon}"></i>
        </div>
        <h3 class="step-title">${currentStepData.name}</h3>
        <p class="step-description">${currentStepData.description}</p>
        <div class="step-actions">
            <button class="btn btn-primary" onclick="completeStep()">
                <i class="fas fa-check"></i>
                Complete Step
            </button>
            <button class="btn btn-danger" onclick="dropOff()">
                <i class="fas fa-times"></i>
                Drop Off Here
            </button>
        </div>
    `;
}

async function completeStep() {
    showLoading();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update session
    const stepIndex = currentSession.currentStep - 1;
    currentSession.steps[stepIndex].completed = true;
    currentSession.steps[stepIndex].timestamp = new Date().toISOString();
    
    if (currentSession.currentStep < STEPS.length) {
        currentSession.currentStep++;
        updateSimulatorDisplay();
    } else {
        // Complete session
        currentSession.endTime = new Date().toISOString();
        saveSession();
        currentSession.currentStep++;
        updateSimulatorDisplay();
    }
    
    hideLoading();
}

function dropOff() {
    currentSession.endTime = new Date().toISOString();
    saveSession();
    startNewSession();
}

function saveSession() {
    const sessionData = {
        id: Date.now().toString(),
        userId: currentSession.userId,
        steps: currentSession.steps,
        completedAt: currentSession.endTime,
        dropOffStep: currentSession.currentStep <= STEPS.length ? currentSession.currentStep : null
    };
    
    onboardingData.push(sessionData);
    saveData();
    updateStats();
    
    showNotification('Session data saved!', 'success');
}

// Analytics Functions
function initializeAnalytics() {
    updateAnalyticsStats();
    renderCharts();
}

function updateAnalyticsStats() {
    const analysis = analyzeData();
    
    document.getElementById('analytics-total-sessions').textContent = analysis.totalSessions;
    document.getElementById('analytics-completion-rate').textContent = `${analysis.completionRate.toFixed(1)}%`;
    document.getElementById('analytics-common-dropoff').textContent = `Step ${analysis.mostCommonDropOff}`;
    document.getElementById('analytics-insights-count').textContent = insights.length;
}

function analyzeData() {
    const totalSessions = onboardingData.length;
    
    if (totalSessions === 0) {
        return {
            totalSessions: 0,
            completionRate: 0,
            dropOffRates: {},
            mostCommonDropOff: 1
        };
    }
    
    // Calculate completion rate
    const completedSessions = onboardingData.filter(session => 
        session.steps.filter(step => step.completed).length === 5
    ).length;
    const completionRate = (completedSessions / totalSessions) * 100;
    
    // Calculate drop-off rates
    const dropOffRates = {};
    for (let step = 1; step <= 5; step++) {
        const dropOffs = onboardingData.filter(session => session.dropOffStep === step).length;
        dropOffRates[step] = (dropOffs / totalSessions) * 100;
    }
    
    // Find most common drop-off
    const mostCommonDropOff = Object.entries(dropOffRates)
        .reduce((max, [step, rate]) => rate > max.rate ? { step: parseInt(step), rate } : max, 
        { step: 1, rate: 0 }).step;
    
    return {
        totalSessions,
        completionRate,
        dropOffRates,
        mostCommonDropOff
    };
}

function renderCharts() {
    if (onboardingData.length === 0) {
        document.getElementById('completion-chart').innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-bar"></i>
                <h3>No Data Available</h3>
                <p>Run some simulations to see charts</p>
            </div>
        `;
        document.getElementById('dropoff-chart').innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-line"></i>
                <h3>No Data Available</h3>
                <p>Run some simulations to see charts</p>
            </div>
        `;
        return;
    }
    
    renderCompletionChart();
    renderDropOffChart();
}

function renderCompletionChart() {
    const stepCompletions = STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const completions = onboardingData.filter(session => 
            session.steps.some(s => s.stepNumber === stepNumber && s.completed)
        ).length;
        return {
            name: step.name,
            completions,
            percentage: onboardingData.length > 0 ? (completions / onboardingData.length) * 100 : 0
        };
    });
    
    const container = document.getElementById('completion-chart');
    container.innerHTML = '';
    
    stepCompletions.forEach((step, index) => {
        const barElement = document.createElement('div');
        barElement.className = 'chart-bar';
        
        const colors = ['blue', 'green', 'yellow', 'orange', 'red'];
        
        barElement.innerHTML = `
            <div class="chart-label">
                <span>${step.name}</span>
                <span>${step.completions}/${onboardingData.length} (${step.percentage.toFixed(1)}%)</span>
            </div>
            <div class="chart-bar-bg">
                <div class="chart-bar-fill ${colors[index]}" style="width: ${step.percentage}%"></div>
            </div>
        `;
        
        container.appendChild(barElement);
    });
}

function renderDropOffChart() {
    const dropOffs = STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const dropOffCount = onboardingData.filter(session => session.dropOffStep === stepNumber).length;
        return {
            name: step.name,
            dropOffs: dropOffCount,
            percentage: onboardingData.length > 0 ? (dropOffCount / onboardingData.length) * 100 : 0
        };
    });
    
    const maxDropOffs = Math.max(...dropOffs.map(d => d.dropOffs));
    const container = document.getElementById('dropoff-chart');
    container.innerHTML = '';
    
    dropOffs.forEach((dropOff, index) => {
        const barElement = document.createElement('div');
        barElement.className = 'chart-bar';
        
        const width = maxDropOffs > 0 ? (dropOff.dropOffs / maxDropOffs) * 100 : 0;
        
        barElement.innerHTML = `
            <div class="chart-label">
                <span>${dropOff.name}</span>
                <span>${dropOff.dropOffs} users (${dropOff.percentage.toFixed(1)}%)</span>
            </div>
            <div class="chart-bar-bg">
                <div class="chart-bar-fill red" style="width: ${width}%"></div>
            </div>
        `;
        
        container.appendChild(barElement);
    });
}

// AI Insights Generation
async function generateInsights() {
    if (onboardingData.length === 0) {
        showNotification('No data available for analysis', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const analysis = analyzeData();
        insights = generateAIInsights(analysis);
        
        saveData();
        updateStats();
        displayInsights(insights);
        
        showNotification('AI insights generated successfully!', 'success');
    } catch (error) {
        showNotification('Error generating insights', 'error');
    } finally {
        hideLoading();
    }
}

function generateAIInsights(analysis) {
    const generatedInsights = [];
    
    // Analyze completion rate
    if (analysis.completionRate < 30) {
        generatedInsights.push("⚠️ Critical: Only " + analysis.completionRate.toFixed(1) + "% of users complete onboarding. Consider simplifying the process or reducing the number of required steps.");
    } else if (analysis.completionRate < 60) {
        generatedInsights.push("📊 Your completion rate of " + analysis.completionRate.toFixed(1) + "% has room for improvement. Focus on the steps with highest drop-off rates.");
    } else {
        generatedInsights.push("✅ Great! Your completion rate of " + analysis.completionRate.toFixed(1) + "% is above average. Continue optimizing for even better results.");
    }
    
    // Analyze drop-off patterns
    const highestDropOff = Object.entries(analysis.dropOffRates)
        .reduce((max, [step, rate]) => rate > max.rate ? { step: parseInt(step), rate } : max, 
        { step: 1, rate: 0 });
    
    if (highestDropOff.rate > 20) {
        const stepNames = ['Sign Up', 'Email Verification', 'Profile Setup', 'Upload ID', 'Payment'];
        generatedInsights.push(`🔍 Step ${highestDropOff.step} (${stepNames[highestDropOff.step - 1]}) has the highest drop-off rate at ${highestDropOff.rate.toFixed(1)}%. Consider adding progress indicators, clearer instructions, or reducing form complexity.`);
    }
    
    // Specific step recommendations
    if (analysis.dropOffRates[4] > 15) {
        generatedInsights.push("📁 High drop-off at ID Upload suggests friction. Recommendations: Add file format examples, implement drag-and-drop, provide clear privacy assurance, or make this step optional initially.");
    }
    
    if (analysis.dropOffRates[5] > 25) {
        generatedInsights.push("💳 Payment step shows significant abandonment. Consider: offering a free trial period, displaying security badges, providing multiple payment options, or implementing guest checkout.");
    }
    
    if (analysis.dropOffRates[2] > 20) {
        generatedInsights.push("📧 Email verification drop-off is high. Improvements: implement magic links, reduce verification time, provide clear next steps, or allow users to continue while verification is pending.");
    }
    
    // General recommendations
    generatedInsights.push("💡 Recommended optimizations: Add a progress bar showing completion percentage, implement auto-save for partially completed forms, and provide clear value propositions at each step.");
    
    if (analysis.totalSessions > 10) {
        generatedInsights.push("🎯 User behavior analysis suggests implementing smart defaults and conditional logic to reduce form fields based on user type selection in the profile setup step.");
    }
    
    return generatedInsights.slice(0, 5);
}

function displayInsights(insightsList) {
    const containers = ['insights-list', 'analytics-insights-list'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        insightsList.forEach((insight, index) => {
            const insightElement = document.createElement('div');
            insightElement.className = 'insight-item';
            insightElement.style.animationDelay = `${index * 100}ms`;
            
            // Determine insight type for styling
            if (insight.includes('⚠️') || insight.includes('friction') || insight.includes('drop')) {
                insightElement.classList.add('warning');
            } else if (insight.includes('✅') || insight.includes('Great')) {
                insightElement.classList.add('success');
            } else {
                insightElement.classList.add('info');
            }
            
            insightElement.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 1rem;">
                    <div style="flex-shrink: 0;">
                        <i class="fas fa-lightbulb" style="font-size: 1.25rem; color: #fbbf24;"></i>
                    </div>
                    <div style="flex: 1;">
                        <p style="color: #e5e7eb; line-height: 1.6;">${insight}</p>
                    </div>
                </div>
            `;
            
            container.appendChild(insightElement);
        });
    });
    
    // Show insights containers
    document.querySelectorAll('.insights-container').forEach(container => {
        container.classList.remove('hidden');
    });
}

function hideInsights() {
    document.querySelectorAll('.insights-container').forEach(container => {
        container.classList.add('hidden');
    });
}

// Utility Functions
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);