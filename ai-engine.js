// ai-engine.js – AI detection simulation with disease diagnosis
(function() {
    'use strict';

    // Disease database
    const diseaseDatabase = [
        {
            crop: 'Tomato',
            condition: 'Early Blight',
            confidence: 84,
            symptoms: ['Dark concentric rings', 'Yellow halos on leaves'],
            cause: 'Fungal (Alternaria solani)',
            fertilizer: 'Copper-based fungicide',
            organic: 'Neem oil + baking soda spray',
            dosage: '20ml per 5L water, apply weekly'
        },
        {
            crop: 'Wheat',
            condition: 'Leaf Rust',
            confidence: 88,
            symptoms: ['Orange/red pustules', 'Chlorotic spots'],
            cause: 'Fungal (Puccinia triticina)',
            fertilizer: 'Propiconazole-based spray',
            organic: 'Sulfur dust + compost tea',
            dosage: '15ml per 4L, apply every 10 days'
        },
        {
            crop: 'Maize',
            condition: 'Nitrogen Deficiency',
            confidence: 79,
            symptoms: ['V-shaped yellowing', 'Stunted growth'],
            cause: 'Nutrient deficiency',
            fertilizer: 'Urea (46-0-0) side-dress',
            organic: 'Compost manure + blood meal',
            dosage: '40g per plant, water in well'
        },
        {
            crop: 'Rice',
            condition: 'Bacterial Blight',
            confidence: 81,
            symptoms: ['Water-soaked lesions', 'Yellowish edges'],
            cause: 'Bacterial (Xanthomonas oryzae)',
            fertilizer: 'Streptomycin sulfate',
            organic: 'Copper oxychloride + garlic extract',
            dosage: '2g per litre, spray at tillering'
        },
        {
            crop: 'Potato',
            condition: 'Late Blight',
            confidence: 86,
            symptoms: ['Dark green/black lesions', 'White fungal growth'],
            cause: 'Fungal (Phytophthora infestans)',
            fertilizer: 'Mancozeb-based fungicide',
            organic: 'Copper sulfate + lime mixture',
            dosage: '25g per 5L, apply every 7 days'
        },
        {
            crop: 'Soybean',
            condition: 'Soybean Rust',
            confidence: 82,
            symptoms: ['Tiny brown spots', 'Yellowing leaves'],
            cause: 'Fungal (Phakopsora pachyrhizi)',
            fertilizer: 'Triazole fungicide',
            organic: 'Sulfur + neem extract',
            dosage: '15ml per 3L, spray at flowering'
        }
    ];

    let detections = [];
    let intervalId = null;
    let isRunning = true;
    let currentDiagnosis = null;

    // Generate random detections with disease data
    function generateDetections() {
        const count = 1 + Math.floor(Math.random() * 3);
        const newDetections = [];

        // Always include at least one disease detection
        const disease = diseaseDatabase[Math.floor(Math.random() * diseaseDatabase.length)];
        currentDiagnosis = disease;

        newDetections.push({
            label: disease.crop,
            condition: disease.condition,
            confidence: disease.confidence / 100,
            color: '#6fbf6f',
            x: 0.2 + Math.random() * 0.4,
            y: 0.2 + Math.random() * 0.4,
            w: 0.15 + Math.random() * 0.2,
            h: 0.15 + Math.random() * 0.2,
            disease: disease
        });

        // Add some random extra detections (noise)
        for (let i = 1; i < count; i++) {
            const otherDisease = diseaseDatabase[Math.floor(Math.random() * diseaseDatabase.length)];
            newDetections.push({
                label: otherDisease.crop,
                condition: otherDisease.condition,
                confidence: 0.5 + Math.random() * 0.3,
                color: '#f5b342',
                x: 0.05 + Math.random() * 0.8,
                y: 0.05 + Math.random() * 0.7,
                w: 0.08 + Math.random() * 0.15,
                h: 0.08 + Math.random() * 0.15,
                disease: otherDisease
            });
        }

        return newDetections;
    }

    function updateDetectionList() {
        detections = generateDetections();
        const list = document.getElementById('detectionLog');
        if (!list) return;

        // Clear existing items (keep the empty message)
        const emptyMsg = list.querySelector('.log-empty');
        list.innerHTML = '';

        if (detections.length === 0) {
            if (emptyMsg) list.appendChild(emptyMsg);
            return;
        }

        // Add detection items
        detections.forEach((d, index) => {
            const li = document.createElement('li');
            const now = new Date();
            const timeStr = now.toLocaleTimeString();
            const confidence = Math.round(d.confidence * 100);
            const icon = d.confidence > 0.75 ? '✅' : '🔍';
            li.innerHTML = `
                <span>${icon} ${d.label} — ${d.condition}</span>
                <span class="log-time">${confidence}% · ${timeStr}</span>
            `;
            if (index === 0) li.style.borderLeft = '3px solid #6fbf6f';
            list.appendChild(li);
        });
    }

    function getLatestDiagnosis() {
        if (detections.length === 0) return null;
        // Return the first detection (primary)
        return detections[0]?.disease || null;
    }

    function startAI(interval = 2000) {
        if (intervalId) clearInterval(intervalId);
        isRunning = true;
        intervalId = setInterval(() => {
            if (!isRunning) return;
            updateDetectionList();
            // Update camera overlay
            if (window.Camera) {
                window.Camera.drawOverlay(detections);
            }
            // Update UI with diagnosis
            if (window.UI) {
                const diagnosis = getLatestDiagnosis();
                if (diagnosis) {
                    window.UI.updateDiagnosis(diagnosis);
                }
            }
        }, interval);
        // Initial run
        updateDetectionList();
        const initialDiagnosis = getLatestDiagnosis();
        if (initialDiagnosis && window.UI) {
            window.UI.updateDiagnosis(initialDiagnosis);
        }
    }

    function stopAI() {
        isRunning = false;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function forceScan() {
        // Force a fresh detection
        updateDetectionList();
        if (window.Camera) {
            window.Camera.drawOverlay(detections);
        }
        const diagnosis = getLatestDiagnosis();
        if (diagnosis && window.UI) {
            window.UI.updateDiagnosis(diagnosis);
        }
        if (window.DataManager) {
            window.DataManager.recordDetection(detections);
        }
        return diagnosis;
    }

    // Expose AI engine
    window.AI = {
        start: startAI,
        stop: stopAI,
        getDetections: () => detections,
        getDiagnosis: getLatestDiagnosis,
        generate: generateDetections,
        updateList: updateDetectionList,
        forceScan: forceScan
    };

})();
