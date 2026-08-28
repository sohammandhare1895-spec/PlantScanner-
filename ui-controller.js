// ui-controller.js – UI updates and interactions
(function() {
    'use strict';

    const elements = {
        cropName: document.getElementById('cropName'),
        cropCondition: document.getElementById('cropCondition'),
        confidenceFill: document.getElementById('confidenceFill'),
        liveFeedback: document.getElementById('liveFeedback'),
        sym1: document.getElementById('sym1'),
        cause: document.getElementById('cause'),
        fert: document.getElementById('fert'),
        organic: document.getElementById('organic'),
        dosage: document.getElementById('dosage'),
        scanBtn: document.getElementById('scanBtn'),
        resetBtn: document.getElementById('resetBtn'),
        timestamp: document.getElementById('timestamp'),
        diagnosisPanel: document.getElementById('diagnosisPanel')
    };

    let lastDiagnosis = null;

    function init() {
        // Update timestamp
        updateTimestamp();
        setInterval(updateTimestamp, 30000);

        // Scan button
        if (elements.scanBtn) {
            elements.scanBtn.addEventListener('click', function() {
                if (window.AI) {
                    const diagnosis = window.AI.forceScan();
                    if (diagnosis && window.DataManager) {
                        const detections = window.AI.getDetections();
                        window.DataManager.recordDetection(detections);
                    }
                    // Haptic feedback
                    if (navigator.vibrate) navigator.vibrate(20);
                    // Visual feedback
                    if (elements.diagnosisPanel) {
                        elements.diagnosisPanel.style.borderColor = '#9fdf9f';
                        setTimeout(() => {
                            elements.diagnosisPanel.style.borderColor = '#3d643e';
                        }, 400);
                    }
                    // Disable briefly
                    elements.scanBtn.disabled = true;
                    setTimeout(() => { elements.scanBtn.disabled = false; }, 500);
                }
            });
        }

        // Reset button
        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', function() {
                if (window.DataManager) {
                    window.DataManager.clearHistory();
                }
                if (window.AI) {
                    window.AI.stop();
                    setTimeout(() => {
                        window.AI.start(2000);
                    }, 300);
                }
                // Reset diagnosis display
                resetDiagnosisDisplay();
                // Clear log
                const log = document.getElementById('detectionLog');
                if (log) {
                    log.innerHTML = '<li class="log-empty">No detections yet</li>';
                }
                // Clear overlay
                if (window.Camera) {
                    window.Camera.drawOverlay([]);
                }
                setFeedback('🔄 Reset complete. Ready for new scan.');
            });
        }

        // Update metrics display
        updateMetrics(window.DataManager ? window.DataManager.getMetrics() : null);
    }

    function updateDiagnosis(diagnosis) {
        if (!diagnosis) {
            resetDiagnosisDisplay();
            return;
        }

        lastDiagnosis = diagnosis;

        if (elements.cropName) {
            elements.cropName.textContent = diagnosis.crop || '—';
        }

        if (elements.cropCondition) {
            const condition = diagnosis.condition || 'Unknown';
            elements.cropCondition.textContent = condition;
            // Color code
            const isHealthy = condition === 'Healthy' || condition === 'Good';
            elements.cropCondition.style.background = isHealthy ? '#2d6b2e' : '#6b3d2d';
            elements.cropCondition.style.borderColor = isHealthy ? '#5d8a5e' : '#8a5d5e';
        }

        const confidence = diagnosis.confidence || 0;
        if (elements.confidenceFill) {
            elements.confidenceFill.style.width = Math.min(100, confidence) + '%';
            // Color based on confidence
            const color = confidence >= 75 ? '#6fbf6f' : confidence >= 50 ? '#f5b342' : '#d97a7a';
            elements.confidenceFill.style.background = color;
        }

        if (elements.sym1) {
            const syms = diagnosis.symptoms || [];
            elements.sym1.textContent = syms.length ? syms.slice(0, 2).join(' · ') : '—';
        }

        if (elements.cause) {
            elements.cause.textContent = diagnosis.cause || '—';
        }

        if (elements.fert) {
            elements.fert.textContent = diagnosis.fertilizer || '—';
        }

        if (elements.organic) {
            elements.organic.textContent = diagnosis.organic || '—';
        }

        if (elements.dosage) {
            elements.dosage.textContent = diagnosis.dosage || '—';
        }

        // Update feedback
        const feedback = diagnosis.confidence >= 75 ?
            `✅ ${diagnosis.crop} — ${diagnosis.condition} detected` :
            `🔍 ${diagnosis.crop} — ${diagnosis.condition} (low confidence)`;
        setFeedback(feedback);

        // Update status
        if (window.Camera) {
            const statusType = diagnosis.confidence >= 75 ? 'scanning' : 'unclear';
            window.Camera.updateStatus('DETECTED', statusType);
        }
    }

    function resetDiagnosisDisplay() {
        if (elements.cropName) elements.cropName.textContent = '—';
        if (elements.cropCondition) {
            elements.cropCondition.textContent = 'Waiting';
            elements.cropCondition.style.background = '#2d4d2e';
            elements.cropCondition.style.borderColor = '#5d8a5e';
        }
        if (elements.confidenceFill) {
            elements.confidenceFill.style.width = '0%';
        }
        if (elements.sym1) elements.sym1.textContent = '—';
        if (elements.cause) elements.cause.textContent = '—';
        if (elements.fert) elements.fert.textContent = '—';
        if (elements.organic) elements.organic.textContent = '—';
        if (elements.dosage) elements.dosage.textContent = '—';
    }

    function setFeedback(msg) {
        if (elements.liveFeedback) {
            elements.liveFeedback.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
        }
    }

    function updateTimestamp() {
        if (elements.timestamp) {
            const now = new Date();
            elements.timestamp.textContent = now.toLocaleString();
        }
    }

    function updateMetrics(metrics) {
        if (!metrics) return;
        // Could display metrics in UI if needed
        // For now, we just log them
        console.log('Metrics updated:', metrics);
    }

    function addLog(event, icon) {
        const log = document.getElementById('detectionLog');
        if (!log) return;
        const empty = log.querySelector('.log-empty');
        if (empty) empty.remove();

        const li = document.createElement('li');
        const time = new Date(event.timestamp || Date.now()).toLocaleTimeString();
        li.innerHTML = `
            <span>${icon || '📡'} ${event.type || 'Event'} ${event.crop ? '— ' + event.crop : ''}</span>
            <span class="log-time">${time}</span>
        `;
        log.prepend(li);
        if (log.children.length > 20) {
            log.removeChild(log.lastChild);
        }
    }

    // Expose UI controller
    window.UI = {
        init: init,
        updateDiagnosis: updateDiagnosis,
        resetDiagnosis: resetDiagnosisDisplay,
        setFeedback: setFeedback,
        updateMetrics: updateMetrics,
        addLog: addLog
    };

})();
