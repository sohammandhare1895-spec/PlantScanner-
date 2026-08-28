// data-manager.js – Data persistence and metrics
(function() {
    'use strict';

    let history = [];
    let metrics = {
        totalScans: 0,
        healthyCount: 0,
        diseaseCount: 0,
        commonDisease: 'None',
        lastScan: null
    };

    // Load from localStorage
    function loadHistory() {
        try {
            const saved = localStorage.getItem('cropdoc_history');
            if (saved) {
                history = JSON.parse(saved);
                updateMetricsFromHistory();
            }
        } catch (e) {
            console.warn('Failed to load history:', e);
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem('cropdoc_history', JSON.stringify(history));
        } catch (e) {
            console.warn('Failed to save history:', e);
        }
    }

    function updateMetricsFromHistory() {
        metrics.totalScans = history.length;
        if (history.length === 0) return;

        const diseaseCounts = {};
        let diseaseCount = 0;
        let healthyCount = 0;

        history.forEach(entry => {
            if (entry.disease) {
                diseaseCount++;
                const name = entry.disease.condition || 'Unknown';
                diseaseCounts[name] = (diseaseCounts[name] || 0) + 1;
            } else {
                healthyCount++;
            }
        });

        metrics.diseaseCount = diseaseCount;
        metrics.healthyCount = healthyCount;

        // Find most common disease
        let maxCount = 0;
        let mostCommon = 'None';
        for (const [name, count] of Object.entries(diseaseCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = name;
            }
        }
        metrics.commonDisease = mostCommon;

        // Last scan
        if (history.length > 0) {
            metrics.lastScan = history[history.length - 1].timestamp;
        }
    }

    function recordDetection(detections, imageData) {
        if (!detections || detections.length === 0) return;

        const primary = detections[0];
        const entry = {
            timestamp: new Date().toISOString(),
            crop: primary.label || 'Unknown',
            condition: primary.condition || 'Unknown',
            confidence: Math.round((primary.confidence || 0) * 100),
            disease: primary.disease || null,
            detections: detections.map(d => ({
                label: d.label,
                condition: d.condition,
                confidence: Math.round((d.confidence || 0) * 100)
            })),
            imageData: imageData || null
        };

        history.push(entry);
        if (history.length > 100) history.shift(); // Keep last 100

        updateMetricsFromHistory();
        saveHistory();

        // Update UI metrics if available
        if (window.UI) {
            window.UI.updateMetrics(metrics);
        }

        return entry;
    }

    function getHistory() {
        return history;
    }

    function getMetrics() {
        return { ...metrics };
    }

    function clearHistory() {
        history = [];
        updateMetricsFromHistory();
        saveHistory();
        if (window.UI) {
            window.UI.updateMetrics(metrics);
        }
    }

    // Generate event log entry (for compatibility with app.js)
    function generateEvent() {
        const types = ['📸 Scan', '🔍 Detection', '📊 Analysis', '🌾 Crop detected'];
        const type = types[Math.floor(Math.random() * types.length)];
        const crop = ['Tomato', 'Wheat', 'Maize', 'Rice', 'Potato', 'Soybean'][Math.floor(Math.random() * 6)];
        return {
            type: type,
            crop: crop,
            timestamp: new Date().toISOString()
        };
    }

    // Initialize
    loadHistory();

    // Expose DataManager
    window.DataManager = {
        recordDetection: recordDetection,
        getHistory: getHistory,
        getMetrics: getMetrics,
        clearHistory: clearHistory,
        generateEvent: generateEvent,
        loadHistory: loadHistory
    };

})();
