// 3D Visualization using Three.js

class SpectrumVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.userPoint = null;
        this.userScores = null;
        this.rawScores = null; // Store original scores
        this.maxScore = 24; // Always use standard middle quiz range
        this.STANDARD_MAX = 24; // Standard range for all visualizations
        this.compatibilityZones = null;
        this.highlightedArchetype = null;
        this.showCompatibility = false;
        this.controls = {
            isDragging: false,
            previousMousePosition: { x: 0, y: 0 },
            rotation: { x: 0.4, y: 0.4 }
        };
        
        this.init();
    }

    // Normalize scores from any quiz version to standard range
    normalizeScore(score, quizVersion) {
        const maxScores = {
            'demo': 6,
            'middle': 24,
            'comprehensive': 40
        };
        const rawMax = maxScores[quizVersion] || 24;
        return (score / rawMax) * this.STANDARD_MAX;
    }

    // Set max score based on quiz version (for reference only)
    setMaxScore(quizVersion) {
        const maxScores = {
            'demo': 6,
            'middle': 24,
            'comprehensive': 40
        };
        this.quizMaxScore = maxScores[quizVersion] || 24;
        this.currentQuizVersion = quizVersion;
        // Note: We don't recreate the cube anymore - it's always standard size
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0014);
        this.scene.fog = new THREE.Fog(0x0a0014, 50, 100);

        // Create camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(40, 40, 40);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            preserveDrawingBuffer: true,
            alpha: true,
            logarithmicDepthBuffer: true // Better depth handling
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x8855ff, 0.3);
        this.scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0xc084fc, 1.5, 100);
        pointLight1.position.set(20, 20, 20);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xf472b6, 1.5, 100);
        pointLight2.position.set(-20, -20, -20);
        this.scene.add(pointLight2);

        const pointLight3 = new THREE.PointLight(0xfb923c, 1, 100);
        pointLight3.position.set(0, 30, 0);
        this.scene.add(pointLight3);

        // Create the cube framework
        this.createCube();

        // Add axes
        this.createAxes();

        // Add axis labels
        this.createAxisLabels();

        // Add mouse controls
        this.addControls();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation
        this.animate();
    }

    createCube() {
        const size = this.STANDARD_MAX * 2; // Always 48x48x48 (standard range)
        
        // Create glowing edges for the cube
        const edgesGeometry = new THREE.BoxGeometry(size, size, size);
        const edgesMaterial = new THREE.LineBasicMaterial({ 
            color: 0xc084fc, 
            opacity: 0.4, 
            transparent: true,
            linewidth: 2
        });
        const edges = new THREE.EdgesGeometry(edgesGeometry);
        this.cubeEdges = new THREE.LineSegments(edges, edgesMaterial);
        this.scene.add(this.cubeEdges);

        // Add semi-transparent cube faces
        const cubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x8855ff,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide
        });
        this.cubeBox = new THREE.Mesh(edgesGeometry, cubeMaterial);
        this.scene.add(this.cubeBox);

        // Add grid planes at the center with gradient colors
        const gridHelper1 = new THREE.GridHelper(size, 8, 0xc084fc, 0x6b21a8);
        gridHelper1.rotation.x = Math.PI / 2;
        gridHelper1.position.y = 0;
        gridHelper1.material.opacity = 0.15;
        gridHelper1.material.transparent = true;
        this.gridHelper = gridHelper1;
        this.scene.add(gridHelper1);
    }

    createAxes() {
        const axisLength = 30;
        const axisRadius = 0.25;

        // X-Axis (Purple/Pink) - Masculine to Feminine
        const xAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength);
        const xAxisMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xf472b6,
            emissive: 0xf472b6,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        const xAxis = new THREE.Mesh(xAxisGeometry, xAxisMaterial);
        xAxis.rotation.z = Math.PI / 2;
        this.scene.add(xAxis);

        // Y-Axis (Purple) - Dominant to Submissive
        const yAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength);
        const yAxisMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xc084fc,
            emissive: 0xc084fc,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        const yAxis = new THREE.Mesh(yAxisGeometry, yAxisMaterial);
        this.scene.add(yAxis);

        // Z-Axis (Orange) - Romantic to Physical
        const zAxisGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength);
        const zAxisMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xfb923c,
            emissive: 0xfb923c,
            emissiveIntensity: 0.5,
            shininess: 100
        });
        const zAxis = new THREE.Mesh(zAxisGeometry, zAxisMaterial);
        zAxis.rotation.x = Math.PI / 2;
        this.scene.add(zAxis);
    }

    createAxisLabels() {
        // Create text sprites for axis labels
        const createTextLabel = (text, position, color) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 128;
            
            context.fillStyle = color;
            context.font = 'Bold 24px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, 128, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(position);
            sprite.scale.set(8, 4, 1);
            
            return sprite;
        };

        // X-Axis labels
        this.scene.add(createTextLabel('Masculine', new THREE.Vector3(-18, 0, 0), '#f472b6'));
        this.scene.add(createTextLabel('Feminine', new THREE.Vector3(18, 0, 0), '#f472b6'));

        // Y-Axis labels
        this.scene.add(createTextLabel('Dominant', new THREE.Vector3(0, -18, 0), '#c084fc'));
        this.scene.add(createTextLabel('Submissive', new THREE.Vector3(0, 18, 0), '#c084fc'));

        // Z-Axis labels
        this.scene.add(createTextLabel('Romantic', new THREE.Vector3(0, 0, -18), '#fb923c'));
        this.scene.add(createTextLabel('Physical', new THREE.Vector3(0, 0, 18), '#fb923c'));
    }

    plotUserPoint(x, y, z, quizVersion = 'middle') {
        // Remove existing point if any
        if (this.userPoint) {
            this.scene.remove(this.userPoint);
        }

        // Scores are already normalized from scoring.js, just store them
        this.userScores = { x, y, z };
        console.log(`User point (already normalized): X=${x}, Y=${y}, Z=${z}`);

        // Create glowing point with metallic material
        const pointGeometry = new THREE.SphereGeometry(1.8, 64, 64);
        const pointMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.8,
            shininess: 200,
            specular: 0xffffff,
            depthTest: false
        });
        this.userPoint = new THREE.Mesh(pointGeometry, pointMaterial);
        this.userPoint.position.set(x, y, z);
        this.userPoint.renderOrder = 999;
        this.scene.add(this.userPoint);

        // Add inner glow
        const glowGeometry1 = new THREE.SphereGeometry(2.5, 32, 32);
        const glowMaterial1 = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.4,
            depthTest: false
        });
        const glow1 = new THREE.Mesh(glowGeometry1, glowMaterial1);
        glow1.renderOrder = 998;
        this.userPoint.add(glow1);
        
        // Add outer glow
        const glowGeometry2 = new THREE.SphereGeometry(3.5, 32, 32);
        const glowMaterial2 = new THREE.MeshBasicMaterial({
            color: 0xc084fc,
            transparent: true,
            opacity: 0.2,
            depthTest: false
        });
        const glow2 = new THREE.Mesh(glowGeometry2, glowMaterial2);
        glow2.renderOrder = 997;
        this.userPoint.add(glow2);
        
        // Add point light at user position
        const userLight = new THREE.PointLight(0xff00ff, 2, 30);
        userLight.position.set(0, 0, 0);
        this.userPoint.add(userLight);

        // Add connecting lines to show position
        this.addPositionLines(x, y, z);
    }

    addPositionLines(x, y, z) {
        const lineMaterial = new THREE.LineDashedMaterial({
            color: 0xff00ff,
            dashSize: 0.8,
            gapSize: 0.4,
            opacity: 0.5,
            transparent: true,
            linewidth: 2
        });

        // Line to XY plane
        const points1 = [new THREE.Vector3(x, y, z), new THREE.Vector3(x, y, 0)];
        const geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
        const line1 = new THREE.Line(geometry1, lineMaterial);
        line1.computeLineDistances();
        this.scene.add(line1);

        // Line to XZ plane
        const points2 = [new THREE.Vector3(x, y, z), new THREE.Vector3(x, 0, z)];
        const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
        const line2 = new THREE.Line(geometry2, lineMaterial);
        line2.computeLineDistances();
        this.scene.add(line2);

        // Line to YZ plane
        const points3 = [new THREE.Vector3(x, y, z), new THREE.Vector3(0, y, z)];
        const geometry3 = new THREE.BufferGeometry().setFromPoints(points3);
        const line3 = new THREE.Line(geometry3, lineMaterial);
        line3.computeLineDistances();
        this.scene.add(line3);
    }

    plotArchetypePosition(archetype, userScores) {
        // Parse archetype coordinate ranges to get center position
        const parseRange = (rangeStr) => {
            const match = rangeStr.match(/\[([-\d]+),\s*([-\d]+)\]/);
            if (match) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                return (min + max) / 2;
            }
            return 0;
        };

        const archetypeX = parseRange(archetype.ranges.x);
        const archetypeY = parseRange(archetype.ranges.y);
        const archetypeZ = parseRange(archetype.ranges.z);

        // Remove existing archetype marker if any
        if (this.archetypeMarker) {
            this.scene.remove(this.archetypeMarker);
        }
        if (this.archetypeLine) {
            this.scene.remove(this.archetypeLine);
        }

        // Create archetype position marker (different style from user point)
        const markerGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const markerMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.8,
            shininess: 100,
            depthTest: false
        });
        this.archetypeMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        this.archetypeMarker.position.set(archetypeX, archetypeY, archetypeZ);
        this.archetypeMarker.renderOrder = 996;
        this.scene.add(this.archetypeMarker);

        // Add glow to archetype marker
        const archetypeGlowGeometry = new THREE.SphereGeometry(2, 32, 32);
        const archetypeGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3,
            depthTest: false
        });
        const archetypeGlow = new THREE.Mesh(archetypeGlowGeometry, archetypeGlowMaterial);
        archetypeGlow.renderOrder = 995;
        this.archetypeMarker.add(archetypeGlow);

        // Draw connecting line from user position to archetype center
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });

        const points = [
            new THREE.Vector3(userScores.x, userScores.y, userScores.z),
            new THREE.Vector3(archetypeX, archetypeY, archetypeZ)
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        this.archetypeLine = new THREE.Line(lineGeometry, lineMaterial);
        this.archetypeLine.renderOrder = 994;
        this.scene.add(this.archetypeLine);

        // Add pulsing animation to archetype marker
        this.archetypeMarker.userData.pulsePhase = 0;
    }

    addControls() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            this.controls.isDragging = true;
            this.controls.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.controls.isDragging) {
                const deltaX = e.clientX - this.controls.previousMousePosition.x;
                const deltaY = e.clientY - this.controls.previousMousePosition.y;

                this.controls.rotation.y += deltaX * 0.01;
                this.controls.rotation.x += deltaY * 0.01;

                this.controls.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.controls.isDragging = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.controls.isDragging = false;
        });

        // Touch controls for mobile
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.controls.isDragging = true;
                this.controls.previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (this.controls.isDragging && e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - this.controls.previousMousePosition.x;
                const deltaY = e.touches[0].clientY - this.controls.previousMousePosition.y;

                this.controls.rotation.y += deltaX * 0.01;
                this.controls.rotation.x += deltaY * 0.01;

                this.controls.previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            }
        });

        canvas.addEventListener('touchend', () => {
            this.controls.isDragging = false;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Animate archetype marker pulse
        if (this.archetypeMarker) {
            this.archetypeMarker.userData.pulsePhase += 0.05;
            const scale = 1 + Math.sin(this.archetypeMarker.userData.pulsePhase) * 0.15;
            this.archetypeMarker.scale.set(scale, scale, scale);
        }

        // Update camera position based on rotation
        const radius = 40;
        this.camera.position.x = radius * Math.sin(this.controls.rotation.y) * Math.cos(this.controls.rotation.x);
        this.camera.position.y = radius * Math.sin(this.controls.rotation.x);
        this.camera.position.z = radius * Math.cos(this.controls.rotation.y) * Math.cos(this.controls.rotation.x);
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    resetView() {
        this.controls.rotation = { x: 0.4, y: 0.4 };
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    downloadImage() {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = 'sexuality-spectrum-results.png';
        link.href = dataURL;
        link.click();
    }

    // Calculate compatibility score between two points
    calculateCompatibilityScore(x1, y1, z1, x2, y2, z2) {
        // Normalize all coordinates to [-1, 1] range
        const norm_x1 = x1 / this.STANDARD_MAX;
        const norm_y1 = y1 / this.STANDARD_MAX;
        const norm_z1 = z1 / this.STANDARD_MAX;
        const norm_x2 = x2 / this.STANDARD_MAX;
        const norm_y2 = y2 / this.STANDARD_MAX;
        const norm_z2 = z2 / this.STANDARD_MAX;

        // X-axis (Gender Expression): SIMILARITY - closer is better
        const x_diff = Math.abs(norm_x1 - norm_x2);
        const x_acceptable = 4 / this.STANDARD_MAX; // ±4 range normalized
        const x_score = Math.max(0, 1 - (x_diff / x_acceptable));

        // Y-axis (Power Dynamics): COMPLEMENTARITY - opposite is better
        // Compare user to NEGATIVE of candidate (Dom wants Sub, Sub wants Dom)
        const y_diff = Math.abs(norm_y1 - (-norm_y2));
        const y_acceptable = 1.5; // More forgiving since we want opposites
        const y_score = Math.max(0, 1 - (y_diff / y_acceptable));

        // Z-axis (Connection Style): SIMILARITY - closer is better
        const z_diff = Math.abs(norm_z1 - norm_z2);
        const z_acceptable = 4 / this.STANDARD_MAX; // ±4 range normalized
        const z_score = Math.max(0, 1 - (z_diff / z_acceptable));

        // Apply global weights: Y=40%, X=30%, Z=30%
        const weighted_score = (y_score * 0.40) + (x_score * 0.30) + (z_score * 0.30);

        // Convert to 0-1 scale where 1 is most compatible
        return Math.max(0, Math.min(1, weighted_score));
    }

    // Get color based on compatibility score (red to yellow to green)
    getCompatibilityColor(score) {
        // Clamp score between 0 and 1
        score = Math.max(0, Math.min(1, score));
        
        // Thresholds based on compatibility rules:
        // 0.65+ = High compatibility (Green)
        // 0.45-0.65 = Moderate compatibility (Yellow)
        // <0.45 = Low compatibility (Red)
        
        if (score >= 0.65) {
            // High compatibility - Bright green
            const t = (score - 0.65) / 0.35;
            return {
                r: Math.round(51 - (51 * t)),     // 51 -> 0
                g: 255,                            // Bright green
                b: Math.round(136 - (136 * t))    // 136 -> 0
            };
        } else if (score >= 0.45) {
            // Moderate compatibility - Yellow to yellow-green
            const t = (score - 0.45) / 0.2;
            return {
                r: Math.round(255 - (204 * t)),   // 255 -> 51
                g: 255,
                b: Math.round(0 + (136 * t))      // 0 -> 136
            };
        } else {
            // Low compatibility - Red to orange
            const t = score / 0.45;
            return {
                r: 255,
                g: Math.round(50 + (205 * t)),    // 50 -> 255
                b: 0
            };
        }
    }

    // Create compatibility heatmap visualization
    createCompatibilityZones() {
        if (this.compatibilityZones) {
            this.scene.remove(this.compatibilityZones);
            this.compatibilityZones = null;
        }

        if (!this.userScores || !this.showCompatibility) {
            return;
        }

        this.compatibilityZones = new THREE.Group();

        // Define all 27 archetype positions (standard range -24 to +24)
        // Positions are midpoints of ranges: low=[-24,-6], balanced=[-6,6], high=[6,24]
        const categories = ['low', 'balanced', 'high'];
        const positions = {
            'low': -15,      // Midpoint of [-24, -6]
            'balanced': 0,   // Midpoint of [-6, 6]
            'high': 15       // Midpoint of [6, 24]
        };

        // Create sphere for each archetype position
        categories.forEach(xCat => {
            categories.forEach(yCat => {
                categories.forEach(zCat => {
                    const x = positions[xCat];
                    const y = positions[yCat];
                    const z = positions[zCat];

                    // Calculate compatibility score
                    const score = this.calculateCompatibilityScore(
                        this.userScores.x, this.userScores.y, this.userScores.z,
                        x, y, z
                    );

                    // Get color based on compatibility
                    const color = this.getCompatibilityColor(score);
                    const hexColor = (color.r << 16) | (color.g << 8) | color.b;

                    // Create sphere
                    const sphereGeometry = new THREE.SphereGeometry(2, 16, 16);
                    const sphereMaterial = new THREE.MeshPhongMaterial({
                        color: hexColor,
                        transparent: true,
                        opacity: 0.6,
                        emissive: hexColor,
                        emissiveIntensity: 0.3,
                        depthTest: false
                    });
                    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                    sphere.position.set(x, y, z);
                    sphere.renderOrder = 500;

                    // Add glow for high compatibility
                    if (score > 0.5) {
                        const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
                        const glowMaterial = new THREE.MeshBasicMaterial({
                            color: hexColor,
                            transparent: true,
                            opacity: 0.2,
                            depthTest: false
                        });
                        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                        glow.renderOrder = 499;
                        sphere.add(glow);
                    }

                    this.compatibilityZones.add(sphere);
                });
            });
        });

        this.scene.add(this.compatibilityZones);
        this.compatibilityZones.visible = true;
        console.log('Created 27 archetype compatibility spheres');
    }

    // Highlight a specific archetype location on the graph
    highlightArchetypeLocation(ranges) {
        // Remove existing highlight
        if (this.highlightedArchetype) {
            this.scene.remove(this.highlightedArchetype);
            this.highlightedArchetype = null;
        }

        if (!ranges) return;

        // Parse range strings like "[-24, -7]" to get center point
        const parseRange = (rangeStr) => {
            const matches = rangeStr.match(/\[(-?\d+),\s*(-?\d+)\]/);
            if (matches) {
                const min = parseInt(matches[1]);
                const max = parseInt(matches[2]);
                return (min + max) / 2;
            }
            return 0;
        };

        const x = parseRange(ranges.x);
        const y = parseRange(ranges.y);
        const z = parseRange(ranges.z);
        console.log(`Highlighting archetype at: X=${x}, Y=${y}, Z=${z} from ranges:`, ranges);

        // Create a highlighted region (glowing box)
        const highlightGroup = new THREE.Group();

        // Main highlight sphere
        const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        highlightGroup.add(sphere);

        // Outer glow
        const glowGeometry = new THREE.SphereGeometry(4, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        highlightGroup.add(glow);

        // Add pulsing point light
        const light = new THREE.PointLight(0x00ffff, 2, 20);
        highlightGroup.add(light);

        highlightGroup.position.set(x, y, z);
        this.highlightedArchetype = highlightGroup;
        this.scene.add(this.highlightedArchetype);

        // Add animation for pulsing effect
        let pulseTime = 0;
        const pulseInterval = setInterval(() => {
            if (!this.highlightedArchetype) {
                clearInterval(pulseInterval);
                return;
            }
            pulseTime += 0.05;
            const scale = 1 + Math.sin(pulseTime * 2) * 0.15;
            glow.scale.set(scale, scale, scale);
        }, 50);
    }

    // Clear archetype highlight
    clearArchetypeHighlight() {
        if (this.highlightedArchetype) {
            this.scene.remove(this.highlightedArchetype);
            this.highlightedArchetype = null;
        }
    }

    // Toggle compatibility visualization
    toggleCompatibility(show) {
        this.showCompatibility = show;
        this.createCompatibilityZones();
    }

    updateTheme(isDark) {
        this.scene.background = new THREE.Color(isDark ? 0x000000 : 0x0a0014);
    }
}
