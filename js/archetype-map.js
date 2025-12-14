// Archetype Map Visualization - Shows all 27 archetypes on start page

class ArchetypeMapVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            50,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        this.controls = {
            rotation: { x: 0.3, y: 0 },
            isDragging: false,
            previousMousePosition: { x: 0, y: 0 },
            autoRotate: true
        };

        // Using standard quiz max score for visualization
        this.maxScore = 24;
        
        // Store clickable spheres and their archetype data
        this.archetypeSpheres = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.init();
        this.setupControls();
        this.animate();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    init() {
        // Setup scene with darker background
        this.scene.background = new THREE.Color(0x0a0a1a);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 5, 5);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, -5, -5);
        this.scene.add(directionalLight2);

        // Create the visualization
        this.createCube();
        this.createAxes();
        this.createArchetypeMarkers();

        // Position camera
        this.camera.position.set(35, 35, 35);
        this.camera.lookAt(0, 0, 0);
    }

    createCube() {
        // Wireframe cube showing the boundaries
        const size = this.maxScore;
        const geometry = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x4a5568, 
            linewidth: 1,
            opacity: 0.3,
            transparent: true
        });
        const cube = new THREE.LineSegments(edges, material);
        this.scene.add(cube);
    }

    createAxes() {
        const axisLength = this.maxScore * 2;
        const axisRadius = 0.15;

        // X-Axis (Pink) - Masculine to Feminine
        const xAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength);
        const xAxisMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xf472b6,
            emissive: 0xf472b6,
            emissiveIntensity: 0.5
        });
        const xAxis = new THREE.Mesh(xAxisGeometry, xAxisMaterial);
        xAxis.rotation.z = Math.PI / 2;
        this.scene.add(xAxis);

        // Y-Axis (Purple) - Dominant to Submissive
        const yAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength);
        const yAxisMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xc084fc,
            emissive: 0xc084fc,
            emissiveIntensity: 0.5
        });
        const yAxis = new THREE.Mesh(yAxisGeometry, yAxisMaterial);
        this.scene.add(yAxis);

        // Z-Axis (Orange) - Romantic to Physical
        const zAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength);
        const zAxisMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xfb923c,
            emissive: 0xfb923c,
            emissiveIntensity: 0.5
        });
        const zAxis = new THREE.Mesh(zAxisGeometry, zAxisMaterial);
        zAxis.rotation.x = Math.PI / 2;
        this.scene.add(zAxis);
    }

    createArchetypeMarkers() {
        // All 27 archetypes data
        const archetypeData = {
            'low-low-low': { name: 'The Noble Protector', emoji: '🔱', description: 'Masculine, dominant energy with deep romantic connection. You lead with strength while valuing emotional intimacy and tender moments.' },
            'low-low-balanced': { name: 'The Balanced Warrior', emoji: '⚔️', description: 'Masculine dominant presence balancing romance and passion. You protect and lead while appreciating both emotional depth and physical chemistry.' },
            'low-low-high': { name: 'The Primal Dominant', emoji: '⚡', description: 'Masculine, commanding presence driven by physical chemistry. You lead with confidence and intensity, valuing raw attraction and powerful connection.' },
            'low-balanced-low': { name: 'The Gentle Guardian', emoji: '🌙', description: 'Masculine switch with romantic soul. You move fluidly between leading and following, always prioritizing emotional connection.' },
            'low-balanced-balanced': { name: 'The Versatile Masculine', emoji: '🎯', description: 'Masculine energy with adaptable power dynamics. You balance all aspects of intimacy with confidence and flexibility.' },
            'low-balanced-high': { name: 'The Passionate Masculine', emoji: '🔥', description: 'Masculine switch driven by physical chemistry. You blend strength with adaptability, valuing intense physical connection.' },
            'low-high-low': { name: 'The Devoted Romantic', emoji: '🌊', description: 'Masculine submissive with romantic heart. You surrender with grace while maintaining masculine energy, valuing deep emotional bonds.' },
            'low-high-balanced': { name: 'The Trusting Masculine', emoji: '💫', description: 'Masculine submissive balancing connection styles. You yield with confidence, comfortable with both romance and passion.' },
            'low-high-high': { name: 'The Intense Surrender', emoji: '🌋', description: 'Masculine submissive driven by physical desire. You surrender to intense chemistry while maintaining your masculine core.' },
            'balanced-low-low': { name: 'The Romantic Leader', emoji: '🦋', description: 'Androgynous dominant with romantic soul. You lead from a place of balance, valuing emotional depth and authentic connection.' },
            'balanced-low-balanced': { name: 'The Sovereign Presence', emoji: '👑', description: 'Balanced dominant energy comfortable with all forms of intimacy. You command respect while remaining open to both romance and passion.' },
            'balanced-low-high': { name: 'The Dynamic Leader', emoji: '💥', description: 'Androgynous dominant driven by chemistry. You lead with confidence and intensity, prioritizing physical connection.' },
            'balanced-balanced-low': { name: 'The Fluid Romantic', emoji: '🌸', description: 'Complete balance with romantic heart. You flow between all energies with grace, always seeking emotional connection.' },
            'balanced-balanced-balanced': { name: 'The Harmonious Soul', emoji: '✨', description: 'Perfect equilibrium across all dimensions. You embody complete balance and adaptability in all aspects of intimacy.' },
            'balanced-balanced-high': { name: 'The Playful Switch', emoji: '🎭', description: 'Balanced and versatile, driven by chemistry. You explore all dynamics with curiosity and passion.' },
            'balanced-high-low': { name: 'The Tender Dreamer', emoji: '🌹', description: 'Androgynous submissive romantic. You surrender with grace and sensitivity, valuing emotional intimacy above all.' },
            'balanced-high-balanced': { name: 'The Graceful Yielder', emoji: '💎', description: 'Balanced submissive comfortable with all connection styles. You yield with elegance and openness.' },
            'balanced-high-high': { name: 'The Sensual Surrender', emoji: '🔮', description: 'Androgynous submissive driven by physical desire. You embrace intensity and chemistry in your surrender.' },
            'high-low-low': { name: 'The Feminine Dominant', emoji: '🌺', description: 'Feminine energy with commanding presence and romantic heart. You lead with grace and emotional intelligence.' },
            'high-low-balanced': { name: 'The Commanding Feminine', emoji: '💃', description: 'Feminine dominant balancing romance and passion. You take charge with elegance and confidence.' },
            'high-low-high': { name: 'The Fierce Goddess', emoji: '🔥', description: 'Feminine dominant driven by chemistry. You command with sensual power and magnetic intensity.' },
            'high-balanced-low': { name: 'The Romantic Feminine', emoji: '🦢', description: 'Feminine switch with romantic soul. You flow between roles with grace, always prioritizing emotional depth.' },
            'high-balanced-balanced': { name: 'The Balanced Feminine', emoji: '🌙', description: 'Feminine energy with complete adaptability. You embrace all dynamics while maintaining your feminine essence.' },
            'high-balanced-high': { name: 'The Passionate Feminine', emoji: '💋', description: 'Feminine switch driven by chemistry. You blend grace with intensity, valuing powerful physical connection.' },
            'high-high-low': { name: 'The Tender Soul', emoji: '🌷', description: 'Feminine submissive romantic. You surrender with elegance and emotional depth, seeking profound connection.' },
            'high-high-balanced': { name: 'The Graceful Romantic', emoji: '💖', description: 'Feminine submissive balancing connection styles. You yield with beauty and openness to all forms of intimacy.' },
            'high-high-high': { name: 'The Sensual Flame', emoji: '🌶️', description: 'Feminine submissive driven by passion. You surrender to intense chemistry with grace and desire.' }
        };

        // Create markers for all 27 archetype positions
        const threshold = this.maxScore * 0.25; // 6 for standard quiz
        const positions = {
            'low': -this.maxScore / 2,    // -12
            'balanced': 0,
            'high': this.maxScore / 2      // +12
        };

        const categories = ['low', 'balanced', 'high'];
        
        categories.forEach(xCat => {
            categories.forEach(yCat => {
                categories.forEach(zCat => {
                    const x = positions[xCat];
                    const y = positions[yCat];
                    const z = positions[zCat];
                    
                    const key = `${xCat}-${yCat}-${zCat}`;
                    const archetype = archetypeData[key];

                    // Create glowing sphere at each archetype position
                    const geometry = new THREE.SphereGeometry(1.2, 16, 16);
                    
                    // Color based on position
                    let color;
                    if (xCat === 'low') color = 0x3b82f6; // Blue for masculine
                    else if (xCat === 'high') color = 0xec4899; // Pink for feminine
                    else color = 0x8b5cf6; // Purple for balanced

                    const material = new THREE.MeshPhongMaterial({
                        color: color,
                        emissive: color,
                        emissiveIntensity: 0.4,
                        shininess: 100,
                        transparent: true,
                        opacity: 0.8
                    });

                    const sphere = new THREE.Mesh(geometry, material);
                    sphere.position.set(x, y, z);
                    sphere.userData = { archetype, key }; // Store archetype data
                    this.scene.add(sphere);
                    this.archetypeSpheres.push(sphere); // Add to clickable list

                    // Add glow effect
                    const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
                    const glowMaterial = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.2
                    });
                    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                    glow.position.set(x, y, z);
                    this.scene.add(glow);

                    // Add text label with archetype name
                    this.createTextLabel(archetype.emoji + ' ' + archetype.name, new THREE.Vector3(x, y, z), color);
                });
            });
        });
    }

    createTextLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'Bold 28px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 256, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.position.y += 3; // Position above sphere
        sprite.scale.set(10, 2.5, 1);
        
        this.scene.add(sprite);
    }

    setupControls() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            this.controls.isDragging = true;
            this.controls.autoRotate = false;
            this.controls.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.controls.isDragging) {
                const deltaX = e.clientX - this.controls.previousMousePosition.x;
                const deltaY = e.clientY - this.controls.previousMousePosition.y;

                this.controls.rotation.y += deltaX * 0.005;
                this.controls.rotation.x += deltaY * 0.005;

                this.controls.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.controls.isDragging = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.controls.isDragging = false;
        });

        // Click detection for archetype spheres
        canvas.addEventListener('click', (e) => {
            if (this.controls.isDragging) return; // Ignore if user was dragging
            
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.archetypeSpheres);

            if (intersects.length > 0) {
                const clickedSphere = intersects[0].object;
                const archetype = clickedSphere.userData.archetype;
                const key = clickedSphere.userData.key;
                if (archetype) {
                    this.showArchetypeModal(archetype, key);
                }
            }
        });

        // Zoom with mouse wheel
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 1.1 : 0.9;
            const newRadius = Math.sqrt(
                this.camera.position.x ** 2 + 
                this.camera.position.y ** 2 + 
                this.camera.position.z ** 2
            ) * delta;
            
            // Clamp zoom
            if (newRadius > 20 && newRadius < 60) {
                this.camera.position.multiplyScalar(delta);
            }
        });
    }

    showArchetypeModal(archetype, key) {
        // Calculate coordinate ranges for this archetype
        const [xCat, yCat, zCat] = key.split('-');
        const threshold = this.maxScore * 0.25; // 6 for standard quiz
        
        const getRanges = (cat) => {
            if (cat === 'low') return `[-${this.maxScore}, -${Math.ceil(threshold)}]`;
            if (cat === 'balanced') return `[-${Math.floor(threshold)}, ${Math.floor(threshold)}]`;
            return `[${Math.ceil(threshold)}, ${this.maxScore}]`;
        };
        
        const xRange = getRanges(xCat);
        const yRange = getRanges(yCat);
        const zRange = getRanges(zCat);
        
        // Get or create modal
        let modal = document.getElementById('archetype-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'archetype-modal';
            modal.className = 'archetype-modal';
            modal.innerHTML = `
                <div class="archetype-modal-content">
                    <button class="archetype-modal-close">&times;</button>
                    <div class="archetype-modal-header">
                        <span class="archetype-modal-emoji"></span>
                        <h3 class="archetype-modal-name"></h3>
                    </div>
                    <p class="archetype-modal-description"></p>
                    <div class="archetype-modal-coordinates">
                        <h4>Coordinate Ranges</h4>
                        <div class="coordinate-item">
                            <span class="coordinate-label">X (Masculine ↔ Feminine):</span>
                            <span class="coordinate-value"></span>
                        </div>
                        <div class="coordinate-item">
                            <span class="coordinate-label">Y (Dominant ↔ Submissive):</span>
                            <span class="coordinate-value"></span>
                        </div>
                        <div class="coordinate-item">
                            <span class="coordinate-label">Z (Romantic ↔ Physical):</span>
                            <span class="coordinate-value"></span>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close button handler
            modal.querySelector('.archetype-modal-close').addEventListener('click', () => {
                modal.classList.remove('active');
            });

            // Click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        // Update modal content
        modal.querySelector('.archetype-modal-emoji').textContent = archetype.emoji;
        modal.querySelector('.archetype-modal-name').textContent = archetype.name;
        modal.querySelector('.archetype-modal-description').textContent = archetype.description;
        
        // Update coordinate values
        const coordValues = modal.querySelectorAll('.coordinate-value');
        coordValues[0].textContent = xRange;
        coordValues[1].textContent = yRange;
        coordValues[2].textContent = zRange;

        // Show modal
        modal.classList.add('active');
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Auto-rotate if not being dragged
        if (this.controls.autoRotate) {
            this.controls.rotation.y += 0.003;
        }

        // Update camera position based on rotation
        const radius = Math.sqrt(
            this.camera.position.x ** 2 + 
            this.camera.position.y ** 2 + 
            this.camera.position.z ** 2
        );
        
        this.camera.position.x = radius * Math.sin(this.controls.rotation.y) * Math.cos(this.controls.rotation.x);
        this.camera.position.y = radius * Math.sin(this.controls.rotation.x);
        this.camera.position.z = radius * Math.cos(this.controls.rotation.y) * Math.cos(this.controls.rotation.x);
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}
