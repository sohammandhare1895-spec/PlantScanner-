// app.js – Main entry point, orchestrates all modules
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        console.log('🌾 CropDoc starting...');

        // 1. Initialize Camera
        if (window.Camera) {
            window.Camera.init().then(success => {
                if (success) {
                    console.log('📷 Camera ready');
                    window.Camera.setFeedback('📷 Camera ready — press Scan');
                } else {
                    console.warn('⚠️ Camera init failed');
                }
            });
        } else {
            console.warn('Camera module not loaded');
        }

        // 2. Initialize UI
        if (window.UI) {
            window.UI.init();
            console.log('🎨 UI initialized');
        } else {
            console.warn('UI module not loaded');
        }

        // 3. Load data history
        if (window.DataManager) {
            window.DataManager.loadHistory();
            console.log('📊 Data loaded');
        }

        // 4. Start AI engine after a short delay
        setTimeout(() => {
            if (window.AI) {
                window.AI.start(2500);
                console.log('🧠 AI engine started');
            } else {
                console.warn('AI module not loaded');
            }
        }, 1000);

        // 5. Periodic metrics update (for demo)
        setInterval(() => {
            if (window.DataManager) {
                const metrics = window.DataManager.getMetrics();
                if (window.UI) {
                    window.UI.updateMetrics(metrics);
                }
                // Add log event periodically
                const evt = window.DataManager.generateEvent();
                if (window.UI) {
                    window.UI.addLog(evt, '📡');
                }
            }
        }, 5000);

        // 6. Handle resize
        window.addEventListener('resize', () => {
            if (window.Camera) {
                window.Camera.resize();
            }
        });

        console.log('✅ CropDoc ready');
    });

})();
