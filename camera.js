// camera.js – Webcam handling and overlay rendering
(function() {
    'use strict';

    const video = document.getElementById('webcam');
    const canvas = document.getElementById('overlayCanvas');
    const ctx = canvas.getContext('2d');
    let stream = null;
    let isReady = false;
    let detections = [];

    function resizeCanvas() {
        const wrapper = document.getElementById('cameraWrapper');
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    async function initCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            video.srcObject = stream;
            await video.play();
            isReady = true;
            resizeCanvas();
            updateStatus('SCANNING', 'scanning');
            setFeedback('📷 Camera ready — press Scan');
            return true;
        } catch (err) {
            console.warn('Camera init error:', err);
            isReady = false;
            updateStatus('NO CAMERA', 'error');
            setFeedback('⚠️ Camera access denied. Please allow camera permissions.');
            return false;
        }
    }

    function updateStatus(label, type) {
        const dot = document.getElementById('statusDot');
        const labelEl = document.getElementById('statusLabel');
        if (dot) {
            dot.className = 'status-dot';
            if (type) dot.classList.add(type);
        }
        if (labelEl) labelEl.textContent = label;
    }

    function setFeedback(msg) {
        const el = document.getElementById('liveFeedback');
        if (el) el.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    }

    function drawOverlay(detectionsList) {
        detections = detectionsList || [];
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (!detections.length) return;

        detections.forEach(d => {
            const x = d.x * w;
            const y = d.y * h;
            const bw = d.w * w;
            const bh = d.h * h;

            // bounding box
            ctx.strokeStyle = d.color || '#6fbf6f';
            ctx.lineWidth = 3;
            ctx.shadowColor = d.color || '#6fbf6f';
            ctx.shadowBlur = 10;
            ctx.strokeRect(x, y, bw, bh);
            ctx.shadowBlur = 0;

            // label background
            const label = `${d.label || 'Crop'} ${Math.round((d.confidence || 0) * 100)}%`;
            ctx.font = 'bold 14px Segoe UI, sans-serif';
            const metrics = ctx.measureText(label);
            const tw = metrics.width + 16;
            const th = 30;
            ctx.fillStyle = d.color || '#2d4d2e';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 8;
            ctx.fillRect(x, y - th, tw, th);
            ctx.shadowBlur = 0;

            // label text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px Segoe UI, sans-serif';
            ctx.fillText(label, x + 8, y - 8);
        });
    }

    function captureFrame() {
        if (!isReady || !video.videoWidth) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0);
        return tempCanvas;
    }

    // Expose public API
    window.Camera = {
        init: initCamera,
        resize: resizeCanvas,
        drawOverlay: drawOverlay,
        capture: captureFrame,
        isReady: () => isReady,
        updateStatus: updateStatus,
        setFeedback: setFeedback
    };

    // Resize on window change
    window.addEventListener('resize', () => {
        if (window.Camera) window.Camera.resize();
    });

})();
