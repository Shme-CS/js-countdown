/**
 * Countdown Timer Application
 * A professional countdown timer with multiple events, dark mode, and localStorage persistence
 * @author Frontend Engineer
 * @version 1.0.0
 */

// ===================================
// Global State Management
// ===================================
let countdowns = [];
let updateInterval = null;

// ===================================
// DOM Elements Cache
// ===================================
const DOM = {
    form: null,
    eventTitle: null,
    eventDate: null,
    eventTime: null,
    countdownList: null,
    emptyState: null,
    themeToggle: null,
    presetButtons: null
};

// ===================================
// Application Initialization
// ===================================
/**
 * Initialize the application on page load
 * Sets up event listeners and loads saved data
 */
function initializeApp() {
    // Cache DOM elements
    cacheDOMElements();
    
    // Load saved countdowns from localStorage
    loadFromLocalStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize theme
    initializeTheme();
    
    // Set minimum date to today
    setMinimumDate();
    
    // Start the update interval
    startUpdateInterval();
    
    // Initial render
    renderAllCountdowns();
}

/**
 * Cache frequently accessed DOM elements
 */
function cacheDOMElements() {
    DOM.form = document.getElementById('countdownForm');
    DOM.eventTitle = document.getElementById('eventTitle');
    DOM.eventDate = document.getElementById('eventDate');
    DOM.eventTime = document.getElementById('eventTime');
    DOM.countdownList = document.getElementById('countdownList');
    DOM.emptyState = document.getElementById('emptyState');
    DOM.themeToggle = document.getElementById('themeToggle');
    DOM.presetButtons = document.querySelectorAll('.btn-preset');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Form submission
    DOM.form.addEventListener('submit', handleFormSubmit);
    
    // Theme toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Preset buttons
    DOM.presetButtons.forEach(button => {
        button.addEventListener('click', handlePresetClick);
    });
}

/**
 * Set minimum date input to today
 */
function setMinimumDate() {
    const today = new Date().toISOString().split('T')[0];
    DOM.eventDate.setAttribute('min', today);
}

// ===================================
// Countdown Creation & Management
// ===================================
/**
 * Handle form submission to create new countdown
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = DOM.eventTitle.value.trim();
    const date = DOM.eventDate.value;
    const time = DOM.eventTime.value;
    
    if (!title || !date || !time) {
        alert('Please fill in all fields');
        return;
    }
    
    createCountdown(title, date, time);
    
    // Reset form
    DOM.form.reset();
}

/**
 * Create a new countdown event and add to state
 * @param {string} title - Event title
 * @param {string} date - Event date (YYYY-MM-DD)
 * @param {string} time - Event time (HH:MM)
 */
function createCountdown(title, date, time) {
    const targetDate = new Date(`${date}T${time}`);
    
    // Validate future date
    if (targetDate <= new Date()) {
        alert('Please select a future date and time');
        return;
    }
    
    const countdown = {
        id: generateUniqueId(),
        title: title,
        targetDate: targetDate.toISOString(),
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    countdowns.push(countdown);
    saveToLocalStorage();
    renderAllCountdowns();
}

/**
 * Generate a unique ID for countdown events
 * @returns {string} Unique identifier
 */
function generateUniqueId() {
    return `countdown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Delete a countdown event with confirmation
 * @param {string} id - Countdown ID to delete
 */
function deleteCountdown(id) {
    if (!confirm('Are you sure you want to delete this countdown?')) {
        return;
    }
    
    countdowns = countdowns.filter(countdown => countdown.id !== id);
    saveToLocalStorage();
    renderAllCountdowns();
}

/**
 * Reset a completed countdown event to active state
 * @param {string} id - Countdown ID to reset
 */
function resetCountdown(id) {
    const countdown = countdowns.find(c => c.id === id);
    if (countdown) {
        countdown.completed = false;
        saveToLocalStorage();
        renderAllCountdowns();
    }
}

// ===================================
// Time Calculation
// ===================================
/**
 * Calculate remaining time until target date
 * Uses precise time calculation with milliseconds
 * @param {string} targetDateISO - Target date in ISO format
 * @returns {Object} Object containing days, hours, minutes, seconds, and total milliseconds
 */
function calculateRemainingTime(targetDateISO) {
    const now = new Date().getTime();
    const target = new Date(targetDateISO).getTime();
    const difference = target - now;
    
    if (difference <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            total: 0
        };
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return {
        days,
        hours,
        minutes,
        seconds,
        total: difference
    };
}

// ===================================
// Rendering Functions
// ===================================
/**
 * Render all countdown events to the DOM
 * Supports multiple simultaneous countdowns
 */
function renderAllCountdowns() {
    // Clear existing countdowns
    DOM.countdownList.innerHTML = '';
    
    // Show/hide empty state
    if (countdowns.length === 0) {
        DOM.emptyState.style.display = 'block';
        return;
    }
    
    DOM.emptyState.style.display = 'none';
    
    // Render each countdown
    countdowns.forEach(countdown => {
        renderCountdown(countdown);
    });
}

/**
 * Render a single countdown card
 * @param {Object} countdown - Countdown object
 */
function renderCountdown(countdown) {
    const card = document.createElement('div');
    card.className = 'countdown-card';
    card.dataset.id = countdown.id;
    
    const timeRemaining = calculateRemainingTime(countdown.targetDate);
    const isCompleted = timeRemaining.total <= 0;
    
    // Mark as completed if time is up
    if (isCompleted && !countdown.completed) {
        countdown.completed = true;
        saveToLocalStorage();
    }
    
    if (countdown.completed) {
        card.classList.add('completed');
    }
    
    const targetDate = new Date(countdown.targetDate);
    const formattedDate = formatDate(targetDate);
    
    card.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(countdown.title)}</h3>
            <div class="card-actions">
                <button class="btn-icon" onclick="resetCountdown('${countdown.id}')" title="Reset" aria-label="Reset countdown">
                    🔄
                </button>
                <button class="btn-icon" onclick="deleteCountdown('${countdown.id}')" title="Delete" aria-label="Delete countdown">
                    🗑️
                </button>
            </div>
        </div>
        
        ${countdown.completed ? 
            '<div class="celebration-message">🎉 Event Completed! 🎊</div>' :
            `<div class="timer-display">
                <div class="time-unit">
                    <span class="time-value">${padZero(timeRemaining.days)}</span>
                    <span class="time-label">Days</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">${padZero(timeRemaining.hours)}</span>
                    <span class="time-label">Hours</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">${padZero(timeRemaining.minutes)}</span>
                    <span class="time-label">Minutes</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">${padZero(timeRemaining.seconds)}</span>
                    <span class="time-label">Seconds</span>
                </div>
            </div>`
        }
        
        <div class="event-date">
            📅 ${formattedDate}
        </div>
    `;
    
    DOM.countdownList.appendChild(card);
}

/**
 * Update all countdown displays dynamically
 * Called every second by the interval
 */
function updateCountdowns() {
    countdowns.forEach(countdown => {
        if (countdown.completed) return;
        
        const card = document.querySelector(`[data-id="${countdown.id}"]`);
        if (!card) return;
        
        const timeRemaining = calculateRemainingTime(countdown.targetDate);
        
        // Check if countdown just completed
        if (timeRemaining.total <= 0 && !countdown.completed) {
            countdown.completed = true;
            saveToLocalStorage();
            renderAllCountdowns();
            return;
        }
        
        // Update time values
        const timeUnits = card.querySelectorAll('.time-value');
        if (timeUnits.length === 4) {
            timeUnits[0].textContent = padZero(timeRemaining.days);
            timeUnits[1].textContent = padZero(timeRemaining.hours);
            timeUnits[2].textContent = padZero(timeRemaining.minutes);
            timeUnits[3].textContent = padZero(timeRemaining.seconds);
        }
    });
}

/**
 * Start the interval to update countdowns every second
 * Uses setInterval for real-time updates
 */
function startUpdateInterval() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    updateInterval = setInterval(updateCountdowns, 1000);
}

// ===================================
// Preset Handlers
// ===================================
/**
 * Handle preset button clicks
 * @param {Event} e - Click event
 */
function handlePresetClick(e) {
    const preset = e.target.dataset.preset;
    
    switch (preset) {
        case 'newyear':
            setNewYearPreset();
            break;
        case 'birthday':
            setBirthdayPreset();
            break;
        case 'vacation':
            setVacationPreset();
            break;
        case 'custom':
            setCustomPreset();
            break;
    }
}

/**
 * Set New Year preset
 */
function setNewYearPreset() {
    const nextYear = new Date().getFullYear() + 1;
    DOM.eventTitle.value = `New Year ${nextYear}`;
    DOM.eventDate.value = `${nextYear}-01-01`;
    DOM.eventTime.value = '00:00';
}

/**
 * Set Birthday preset (30 days from now)
 */
function setBirthdayPreset() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    DOM.eventTitle.value = 'My Birthday';
    DOM.eventDate.value = date.toISOString().split('T')[0];
    DOM.eventTime.value = '00:00';
}

/**
 * Set Vacation preset (60 days from now)
 */
function setVacationPreset() {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    DOM.eventTitle.value = 'Summer Vacation';
    DOM.eventDate.value = date.toISOString().split('T')[0];
    DOM.eventTime.value = '09:00';
}

/**
 * Set Custom preset (7 days from now)
 */
function setCustomPreset() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    DOM.eventTitle.value = 'Custom Event';
    DOM.eventDate.value = date.toISOString().split('T')[0];
    DOM.eventTime.value = '12:00';
}

// ===================================
// LocalStorage Management
// ===================================
/**
 * Save countdowns to localStorage
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('countdowns', JSON.stringify(countdowns));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

/**
 * Load countdowns from localStorage
 */
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('countdowns');
        if (saved) {
            countdowns = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        countdowns = [];
    }
}

// ===================================
// Theme Management
// ===================================
/**
 * Initialize theme from localStorage
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

/**
 * Update theme toggle icon
 * @param {string} theme - Current theme ('light' or 'dark')
 */
function updateThemeIcon(theme) {
    const icon = DOM.themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===================================
// Utility Functions
// ===================================
/**
 * Pad single digit numbers with leading zero
 * @param {number} num - Number to pad
 * @returns {string} Padded number string
 */
function padZero(num) {
    return num.toString().padStart(2, '0');
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// Application Start
// ===================================
// Initialize app when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Cleanup interval on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
