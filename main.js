    // Title pulse animation state
    let titlePulseTime = 0;
window.onload = function() {
    // Utility to get event position (mouse or touch)
    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }
    // Start screen state
    let gameStarted = false;
    // ...existing code...
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    // Responsive canvas sizing
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Center and radius depend on canvas size
    function getCenterX() { return canvas.width / 2; }
    function getCenterY() { return canvas.height / 2; }
    const radius = 20;
    // Use a single borderRadius variable for both the gold circle and button placement
    const borderRadius = 120;
    // Projectiles array
    let projectiles = [];

    // Enemy circles array
    let enemies = [];

    // Trail length
    const TRAIL_LENGTH = 15;

    // Game state
    let gameOver = false;

    // Score counter
    let score = 0;

    // High score (persistent)
    let highScore = parseInt(localStorage.getItem('circleDefenseHighScore') || '0', 10);

    // Particle explosions
    let particles = [];



    // Draw function
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = getCenterX();
        const centerY = getCenterY();
        if (!gameStarted) {
            // Start screen
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw thin white outer border (after background fill)
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
            ctx.restore();
            ctx.save();
            // Draw circular border
            const titleX = canvas.width / 2;
            const titleY = canvas.height / 2 - 80;
            ctx.beginPath();
            ctx.arc(titleX, titleY, borderRadius, 0, Math.PI * 2);
            ctx.lineWidth = 7;
            ctx.strokeStyle = '#ffd700';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.restore();
            // Animate the title with a pulse (shrink/expand)
            titlePulseTime += 0.07;
            const scale = 1 + Math.sin(titlePulseTime * 2) * 0.07;
            ctx.save();
            ctx.translate(titleX, titleY - borderRadius - 30);
            ctx.scale(scale, scale);
            ctx.font = 'bold 48px "Trebuchet MS", "Impact", "Arial Black", Arial, sans-serif';
            // Gold gradient for the title
            let grad = ctx.createLinearGradient(-200, -80, 200, 20);
            grad.addColorStop(0, '#fff8dc');
            grad.addColorStop(0.25, '#ffe066');
            grad.addColorStop(0.5, '#ffd700');
            grad.addColorStop(0.75, '#ffc300');
            grad.addColorStop(1, '#b8860b');
            ctx.fillStyle = grad;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Meteor Strike', 0, 0);
            ctx.restore();
            // Show high score centered inside the gold circle
            ctx.save();
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('High Score: ' + highScore, titleX, titleY);
            ctx.restore();
            // Draw start button with rounded corners, gold gradient, and move it below the circle
            const btnW = 260;
            const btnH = 80;
            const btnR = 28; // corner radius
            const btnX = canvas.width / 2 - btnW / 2;
            // Place button below the gold circle (circle center + borderRadius + margin)
            const btnY = canvas.height / 2 - 80 + borderRadius + 40;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(btnX + btnR, btnY);
            ctx.lineTo(btnX + btnW - btnR, btnY);
            ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + btnR);
            ctx.lineTo(btnX + btnW, btnY + btnH - btnR);
            ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - btnR, btnY + btnH);
            ctx.lineTo(btnX + btnR, btnY + btnH);
            ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - btnR);
            ctx.lineTo(btnX, btnY + btnR);
            ctx.quadraticCurveTo(btnX, btnY, btnX + btnR, btnY);
            ctx.closePath();
            // Gold gradient for button
            let btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
            btnGrad.addColorStop(0, '#fff8dc');
            btnGrad.addColorStop(0.2, '#ffe066');
            btnGrad.addColorStop(0.5, '#ffd700');
            btnGrad.addColorStop(0.8, '#ffc300');
            btnGrad.addColorStop(1, '#b8860b');
            ctx.fillStyle = btnGrad;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            // Draw button text centered
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#b8860b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('START GAME', canvas.width / 2, btnY + btnH / 2);
            ctx.restore();
            return;
        }
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        // Draw score (top left)
        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 20, 40);
        // Draw high score (top right)
        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'right';
        ctx.fillText('High: ' + highScore, canvas.width - 20, 40);
        // Draw enemies
        enemies.forEach(e => {
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fillStyle = e.half ? '#90caf9' : '#2196f3';
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
        // Draw particles
        particles.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,0,${pt.alpha})`;
            ctx.fill();
        });
        // Draw projectiles with trail
        projectiles.forEach(p => {
            // Draw trail
            if (p.trail && p.trail.length > 1) {
                for (let i = 0; i < p.trail.length; i++) {
                    const t = p.trail[i];
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
                    // Fade effect
                    const alpha = (i + 1) / p.trail.length * 0.5;
                    ctx.fillStyle = `rgba(255,82,82,${alpha})`;
                    ctx.fill();
                }
            }
            // Draw projectile
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff5252';
            ctx.fill();
        });
        // Game over text
        if (gameOver) {
            ctx.font = '48px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            // Move message above center for better visibility
            ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 100);
        }
    }

    // Update function
    function update() {
        if (!gameStarted || gameOver) return;
        projectiles.forEach(p => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            // Update trail
            if (!p.trail) p.trail = [];
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > TRAIL_LENGTH) {
                p.trail.shift();
            }
        });
        // Remove projectiles that go off screen
        projectiles = projectiles.filter(p => p.x > 0 && p.x < canvas.width && p.y > 0 && p.y < canvas.height);

        // Update particles
        particles.forEach(pt => {
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.alpha -= 0.03;
        });
        particles = particles.filter(pt => pt.alpha > 0);

        // Update enemies
        enemies.forEach(e => {
            e.x += e.vx;
            e.y += e.vy;
        });

        // Handle projectile-enemy collisions
        let newEnemies = [];
        let toRemoveProjectiles = new Set();
        enemies.forEach((e, ei) => {
            let hit = false;
            let hitPos = null;
            projectiles.forEach((p, pi) => {
                const dist = Math.hypot(e.x - p.x, e.y - p.y);
                if (dist < e.size + 5) {
                    hit = true;
                    hitPos = { x: p.x, y: p.y };
                    toRemoveProjectiles.add(pi);
                }
            });
            if (hit) {
                score++;
                // Particle explosion
                if (hitPos) {
                    for (let i = 0; i < 12; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 2 + Math.random() * 2;
                        particles.push({
                            x: hitPos.x,
                            y: hitPos.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            size: 3 + Math.random() * 2,
                            alpha: 1
                        });
                    }
                }
                if (!e.half) {
                    // Split into two halves, both move toward center
                    const angleToCenter = Math.atan2(getCenterY() - e.y, getCenterX() - e.x);
                    const size = e.size / 2;
                    const speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy) * 1.2;
                    // Both halves move toward center
                    newEnemies.push({ x: e.x, y: e.y, size, vx: Math.cos(angleToCenter) * speed, vy: Math.sin(angleToCenter) * speed, half: true });
                    newEnemies.push({ x: e.x, y: e.y, size, vx: Math.cos(angleToCenter) * speed, vy: Math.sin(angleToCenter) * speed, half: true });
                }
                // If already half, don't add
            } else {
                newEnemies.push(e);
            }
        });
        // Remove projectiles that hit enemies
        projectiles = projectiles.filter((_, i) => !toRemoveProjectiles.has(i));

        // Remove half enemies if hit
        let finalEnemies = [];
        newEnemies.forEach((e, ei) => {
            let hit = false;
            let hitPos = null;
            if (e.half) {
                projectiles.forEach((p, pi) => {
                    const dist = Math.hypot(e.x - p.x, e.y - p.y);
                    if (dist < e.size + 5) {
                        hit = true;
                        hitPos = { x: p.x, y: p.y };
                        toRemoveProjectiles.add(pi);
                    }
                });
            }
            if (hit && hitPos) {
                score++;
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 2;
                    particles.push({
                        x: hitPos.x,
                        y: hitPos.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 3 + Math.random() * 2,
                        alpha: 1
                    });
                }
            }
            if (!hit) finalEnemies.push(e);
        });
        // Remove projectiles that hit half enemies
        projectiles = projectiles.filter((_, i) => !toRemoveProjectiles.has(i));

        // Remove enemies that reach center or go off screen
        enemies = finalEnemies.filter(e => {
            // Collision with center circle
            const centerX = getCenterX();
            const centerY = getCenterY();
            const dist = Math.hypot(e.x - centerX, e.y - centerY);
            if (dist < radius + e.size) {
                gameOver = true;
                // Save high score if beaten
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('circleDefenseHighScore', highScore);
                }
                return false;
            }
            // Remove if off screen
            return e.x > -e.size && e.x < canvas.width + e.size && e.y > -e.size && e.y < canvas.height + e.size;
        });
    }

    // Animation loop with visibility check to prevent freezing on mobile
    let running = true;
    function loop() {
        if (!running) return;
        if (document.hidden) {
            setTimeout(loop, 200);
            return;
        }
        update();
        draw();
        if (!gameOver) {
            requestAnimationFrame(loop);
        } else {
            // Stop enemy spawns on game over
            clearInterval(enemySpawnInterval);
        }
    }
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            running = false;
        } else {
            if (!gameOver) {
                running = true;
                requestAnimationFrame(loop);
            }
        }
    });
    loop();

    // Spawn enemies from edges
    function spawnEnemy() {
        // Random edge: 0=top, 1=right, 2=bottom, 3=left
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) { // top
            x = Math.random() * canvas.width;
            y = -30;
        } else if (edge === 1) { // right
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
        } else if (edge === 2) { // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
        } else { // left
            x = -30;
            y = Math.random() * canvas.height;
        }
        // Variable size (smaller)
        const size = 18 + Math.random() * 22;
        // Direction towards center
        const centerX = getCenterX();
        const centerY = getCenterY();
        const dx = centerX - x;
        const dy = centerY - y;
        const length = Math.sqrt(dx * dx + dy * dy);
        // Increase speed as score increases
        const baseSpeed = 1.5 + Math.random();
        const speedBoost = Math.min(score * 0.07, 4); // max boost
        const speed = baseSpeed + speedBoost;
        const vx = (dx / length) * speed;
        const vy = (dy / length) * speed;
        enemies.push({ x, y, vx, vy, size });
    }
    // Detect if on mobile device
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Spawn enemies at intervals, but pause when tab is inactive
    let enemySpawnInterval = null;
    let ENEMY_SPAWN_RATE = isMobile() ? 2200 : 1200; // slower on mobile
    function startEnemySpawn() {
        if (enemySpawnInterval) clearInterval(enemySpawnInterval);
        enemySpawnInterval = setInterval(() => {
            if (!gameOver && !document.hidden) spawnEnemy();
        }, ENEMY_SPAWN_RATE);
    }
    function stopEnemySpawn() {
        if (enemySpawnInterval) {
            clearInterval(enemySpawnInterval);
            enemySpawnInterval = null;
        }
    }
    startEnemySpawn();
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopEnemySpawn();
        } else {
            if (!gameOver) startEnemySpawn();
        }
    });

    // Mouse click event to shoot projectile
    canvas.addEventListener('mousedown', function(e) {
        const pos = getEventPos(e);
        const centerX = getCenterX();
        const centerY = getCenterY();
        if (!gameStarted) {
            // Match button position and size from draw()
            const btnW = 260;
            const btnH = 80;
            const btnX = canvas.width / 2 - btnW / 2;
            const btnY = canvas.height / 2 - 80 + 120 + 40; // -80 + borderRadius + 40
            if (
                pos.x > btnX && pos.x < btnX + btnW &&
                pos.y > btnY && pos.y < btnY + btnH
            ) {
                gameStarted = true;
            }
            return;
        }
        // Shoot projectile
        const dx = pos.x - centerX;
        const dy = pos.y - centerY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const speed = 7;
        const vx = (dx / length) * speed;
        const vy = (dy / length) * speed;
        projectiles.push({ x: centerX, y: centerY, vx, vy, trail: [{ x: centerX, y: centerY }] });
    });

    // Touch event for mobile (tap = click)
    // Use a flag to prevent multiple rapid touches from freezing the game
    let lastTouch = 0;
    canvas.addEventListener('touchstart', function(e) {
        const now = Date.now();
        if (now - lastTouch < 80) return; // throttle touch events
        lastTouch = now;
        e.preventDefault();
        const pos = getEventPos(e);
        const centerX = getCenterX();
        const centerY = getCenterY();
        if (!gameStarted) {
            // Match button position and size from draw()
            const btnW = 260;
            const btnH = 80;
            const btnX = canvas.width / 2 - btnW / 2;
            const btnY = canvas.height / 2 - 80 + 120 + 40; // -80 + borderRadius + 40
            if (
                pos.x > btnX && pos.x < btnX + btnW &&
                pos.y > btnY && pos.y < btnY + btnH
            ) {
                gameStarted = true;
            }
            return;
        }
        // Shoot projectile
        const dx = pos.x - centerX;
        const dy = pos.y - centerY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const speed = 7;
        const vx = (dx / length) * speed;
        const vy = (dy / length) * speed;
        projectiles.push({ x: centerX, y: centerY, vx, vy, trail: [{ x: centerX, y: centerY }] });
    }, { passive: false });
}
