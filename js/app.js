// Main Application Logic

class SexualitySpectrumApp {
    constructor() {
        this.currentPage = 'landing';
        this.currentQuestionIndex = 0;
        this.responses = [];
        this.visualizer = null;
        this.quizVersion = 'demo'; // Default version
        this.questionsLoaded = false;

        this.init();
    }

    async init() {
        // Load questions from JSON files
        this.questionsLoaded = await loadQuestionSets();
        
        if (!this.questionsLoaded) {
            console.error('Failed to load questions');
            return;
        }

        // Load saved progress
        this.loadProgress();

        // Setup event listeners
        this.setupEventListeners();
        
        // Check for saved results and add view buttons
        this.updateResultButtons();

        // Show appropriate page
        this.showPage(this.currentPage);
        
        // If resuming quiz, load question set and render the current question
        if (this.currentPage === 'quiz') {
            this.setQuestionSet();
            this.renderQuestion();
            this.updateProgress();
        }
    }

    setupEventListeners() {
        // Landing page
        document.getElementById('start-quiz-btn').addEventListener('click', () => {
            this.startQuiz();
        });

        // Version selection
        document.querySelectorAll('input[name="quiz-version"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.quizVersion = e.target.value;
                this.setQuestionSet();
            });
        });

        // Quiz navigation
        document.getElementById('prev-btn').addEventListener('click', () => {
            this.previousQuestion();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('submit-btn').addEventListener('click', () => {
            this.submitQuiz();
        });

        // Results page
        document.getElementById('back-to-start-btn').addEventListener('click', () => {
            this.backToStart();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartQuiz();
        });

        document.getElementById('reset-view-btn').addEventListener('click', () => {
            if (this.visualizer) {
                this.visualizer.resetView();
            }
        });

        document.getElementById('download-btn').addEventListener('click', () => {
            if (this.visualizer) {
                this.visualizer.downloadImage();
            }
        });
        
        // Export results button
        document.getElementById('export-results-btn').addEventListener('click', () => {
            this.exportResults();
        });

        // Compatibility toggle
        document.getElementById('compatibility-viz-toggle').addEventListener('change', (e) => {
            if (this.visualizer) {
                this.visualizer.toggleCompatibility(e.target.checked);
            }
        });
    }

    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const page = document.getElementById(`${pageName}-page`);
        if (page) {
            page.classList.add('active');
        }

        this.currentPage = pageName;
    }

    setQuestionSet() {
        // Set the active question set based on version
        QUESTIONS = getQuestionSet(this.quizVersion);
    }

    startQuiz() {
        this.setQuestionSet();
        this.currentQuestionIndex = 0;
        this.responses = [];
        this.showPage('quiz');
        this.renderQuestion();
        this.updateProgress();
    }

    renderQuestion() {
        // Ensure questions are loaded
        if (!QUESTIONS || QUESTIONS.length === 0) {
            console.error('No questions loaded!');
            this.setQuestionSet();
        }
        
        const question = QUESTIONS[this.currentQuestionIndex];
        
        if (!question) {
            console.error('Question not found at index:', this.currentQuestionIndex);
            return;
        }
        
        const quizContent = document.getElementById('quiz-content');

        // Check if there's a saved response
        const savedResponse = this.responses.find(r => r.questionId === question.id);

        quizContent.innerHTML = `
            <div class="question-card">
                <h2 class="question-text">${question.text}</h2>
                <div class="likert-scale">
                    ${LIKERT_SCALE.map(option => `
                        <label class="likert-option ${savedResponse && savedResponse.value === option.value ? 'selected' : ''}">
                            <input 
                                type="radio" 
                                name="question-${question.id}" 
                                value="${option.value}"
                                ${savedResponse && savedResponse.value === option.value ? 'checked' : ''}
                            >
                            <span class="option-label">${option.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        // Add event listeners to radio buttons
        quizContent.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.saveResponse(question.id, parseInt(e.target.value));
                
                // Update visual selection
                quizContent.querySelectorAll('.likert-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.parentElement.classList.add('selected');
                
                // Auto-advance to next question after a short delay
                setTimeout(() => {
                    if (this.currentQuestionIndex < QUESTIONS.length - 1) {
                        this.nextQuestion();
                    } else {
                        // Last question - enable submit button
                        this.updateNavigationButtons();
                    }
                }, 300); // Small delay for visual feedback
            });
        });

        this.updateNavigationButtons();
    }

    saveResponse(questionId, value) {
        // Remove existing response for this question if any
        this.responses = this.responses.filter(r => r.questionId !== questionId);
        
        // Add new response
        this.responses.push({ questionId, value });
        
        // Save to local storage
        this.saveProgress();
    }

    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / QUESTIONS.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${QUESTIONS.length}`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');

        // Previous button
        prevBtn.disabled = this.currentQuestionIndex === 0;

        // Next/Submit buttons
        if (this.currentQuestionIndex === QUESTIONS.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
            this.updateProgress();
        }
    }

    nextQuestion() {
        // Check if current question is answered
        const currentQuestion = QUESTIONS[this.currentQuestionIndex];
        const hasResponse = this.responses.find(r => r.questionId === currentQuestion.id);

        if (!hasResponse) {
            alert('Please answer this question before proceeding.');
            return;
        }

        if (this.currentQuestionIndex < QUESTIONS.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
            this.updateProgress();
        }
    }

    submitQuiz() {
        // Validate all questions are answered
        if (this.responses.length !== QUESTIONS.length) {
            alert(`Please answer all questions. You have answered ${this.responses.length} of ${QUESTIONS.length}.`);
            return;
        }

        // Calculate scores - pass quiz version to scorer
        const scorer = new QuizScorer(this.responses, this.quizVersion);
        const scores = scorer.calculateScores();
        const interpretation = scorer.generateInterpretation(scores);

        // Save results for this specific quiz version
        this.saveResults(this.quizVersion, scores, interpretation);

        // Clear quiz progress
        localStorage.removeItem('quizProgress');

        // Display results
        this.displayResults(interpretation, scores);

        // Show results page
        this.showPage('results');
        
        // Update result buttons on landing page
        this.updateResultButtons();
    }

    displayResults(interpretation, scores) {
        const { interpretations, archetype, compatibleTypes, normalizedScores } = interpretation;

        // Display archetype hero card
        document.getElementById('archetype-emoji').textContent = archetype.emoji;
        document.getElementById('archetype-name').textContent = archetype.name;
        
        // Create subtitle from axis interpretations (use normalized scores)
        const getShortLabel = (axis, score) => {
            if (axis === 'x') return score < -6 ? 'Masculine' : score > 6 ? 'Feminine' : 'Balanced';
            if (axis === 'y') return score < -6 ? 'Dominant' : score > 6 ? 'Submissive' : 'Switch';
            if (axis === 'z') return score < -6 ? 'Romantic' : score > 6 ? 'Physical' : 'Balanced';
        };
        const subtitle = `${getShortLabel('x', normalizedScores.x)} • ${getShortLabel('y', normalizedScores.y)} • ${getShortLabel('z', normalizedScores.z)}`;
        document.getElementById('archetype-subtitle').textContent = subtitle;

        // Display normalized coordinates (standardized range)
        document.getElementById('coord-x').textContent = normalizedScores.x.toFixed(1);
        document.getElementById('coord-y').textContent = normalizedScores.y.toFixed(1);
        document.getElementById('coord-z').textContent = normalizedScores.z.toFixed(1);

        // Display archetype description
        document.getElementById('archetype-description').innerHTML = `<p>${archetype.description}</p>`;

        // Display axis scores list (use normalized)
        const axisScoresList = document.getElementById('axis-scores-list');
        const getAxisEmoji = (axis, score) => {
            if (axis === 'x') return score < -6 ? '⚔️' : score > 6 ? '🌸' : '⚖️';
            if (axis === 'y') return score < -6 ? '👑' : score > 6 ? '💫' : '🔄';
            if (axis === 'z') return score < -6 ? '💕' : score > 6 ? '🔥' : '⚖️';
        };
        axisScoresList.innerHTML = `
            <div class="axis-score-item">
                <span class="axis-emoji">${getAxisEmoji('x', normalizedScores.x)}</span>
                <div>
                    <strong>Masculine ↔ Feminine</strong>
                    <p>${interpretations.x}</p>
                </div>
            </div>
            <div class="axis-score-item">
                <span class="axis-emoji">${getAxisEmoji('y', normalizedScores.y)}</span>
                <div>
                    <strong>Dominant ↔ Submissive</strong>
                    <p>${interpretations.y}</p>
                </div>
            </div>
            <div class="axis-score-item">
                <span class="axis-emoji">${getAxisEmoji('z', normalizedScores.z)}</span>
                <div>
                    <strong>Romantic ↔ Physical</strong>
                    <p>${interpretations.z}</p>
                </div>
            </div>
        `;

        // Display compatible archetypes
        const compatibleGrid = document.getElementById('compatible-types-grid');
        compatibleGrid.innerHTML = compatibleTypes.map((type, index) => `
            <div class="compatible-type-card-enhanced" data-type-index="${index}">
                <div class="type-emoji">${type.emoji}</div>
                <strong>${type.name}</strong>
                <p class="type-desc-compact">${type.description}</p>
            </div>
        `).join('');

        // Add click handlers to archetype cards
        setTimeout(() => {
            document.querySelectorAll('.compatible-type-card-enhanced').forEach((card, index) => {
                card.addEventListener('click', () => {
                    // Remove active state from all cards
                    document.querySelectorAll('.compatible-type-card-enhanced').forEach(c => {
                        c.classList.remove('active');
                    });
                    
                    // Add active state to clicked card
                    card.classList.add('active');
                    
                    // Highlight on 3D graph
                    if (this.visualizer) {
                        this.visualizer.highlightArchetypeLocation(compatibleTypes[index].ranges);
                    }
                });
            });

            // Add click handler to visualization container to clear highlight
            const vizContainer = document.getElementById('threejs-container');
            if (vizContainer) {
                vizContainer.addEventListener('dblclick', () => {
                    document.querySelectorAll('.compatible-type-card-enhanced').forEach(c => {
                        c.classList.remove('active');
                    });
                    if (this.visualizer) {
                        this.visualizer.clearArchetypeHighlight();
                    }
                });
            }
        }, 200);

        // Store compatible types for later use
        this.currentCompatibleTypes = compatibleTypes;

        // Display interpretation
        document.getElementById('interpretation-text').innerHTML = interpretation.summary;

        // Initialize and display 3D visualization
        setTimeout(() => {
            if (!this.visualizer) {
                this.visualizer = new SpectrumVisualizer('threejs-container');
            }
            // Set max score based on quiz version (for normalization reference)
            this.visualizer.setMaxScore(this.quizVersion);
            // Plot user point with NORMALIZED scores (already standardized)
            this.visualizer.plotUserPoint(normalizedScores.x, normalizedScores.y, normalizedScores.z, this.quizVersion);
            
            // Plot archetype center position and draw connecting line
            this.visualizer.plotArchetypePosition(archetype, normalizedScores);
        }, 100);
    }

    restartQuiz() {
        if (confirm('Are you sure you want to restart? This will clear all your current responses.')) {
            this.currentQuestionIndex = 0;
            this.responses = [];
            localStorage.removeItem('quizProgress');
            this.currentPage = 'quiz';
            this.startQuiz();
        }
    }

    backToStart() {
        // Navigate back to landing page without clearing results
        // User can review their results by taking the quiz again
        this.currentPage = 'landing';
        this.showPage('landing');
        this.updateResultButtons();
    }
    
    saveResults(version, scores, interpretation) {
        const results = {
            version,
            scores,
            interpretation,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(`quizResults_${version}`, JSON.stringify(results));
    }

    loadResults(version) {
        const saved = localStorage.getItem(`quizResults_${version}`);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }

    updateResultButtons() {
        // Add/remove "View Results" buttons for each quiz version
        const versions = ['demo', 'middle', 'comprehensive'];
        versions.forEach(version => {
            const card = document.querySelector(`input[value="${version}"]`).closest('.version-card');
            const results = this.loadResults(version);
            
            // Remove existing button if present
            let existingBtn = card.querySelector('.view-results-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Add button if results exist
            if (results) {
                const btn = document.createElement('button');
                btn.className = 'view-results-btn';
                btn.textContent = '📊 View Results';
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.displaySavedResults(version);
                };
                card.querySelector('.version-card-content').appendChild(btn);
            }
        });
    }

    displaySavedResults(version) {
        const results = this.loadResults(version);
        if (!results) {
            alert('No saved results found for this version.');
            return;
        }
        
        // Set quiz version
        this.quizVersion = version;
        
        // Check if results have normalizedScores (new format)
        // If not, regenerate interpretation with normalization
        if (!results.interpretation.normalizedScores) {
            console.log('Old format detected, regenerating with normalization...');
            // Create a temporary scorer to regenerate interpretation
            const scorer = new QuizScorer([], version);
            const newInterpretation = scorer.generateInterpretation(results.scores);
            results.interpretation = newInterpretation;
        }
        
        // Display the saved results
        this.displayResults(results.interpretation, results.scores);
        this.showPage('results');
    }
    
    clearStuckState() {
        // Emergency clear function
        localStorage.removeItem('quizProgress');
        this.currentQuestionIndex = 0;
        this.responses = [];
        this.currentPage = 'landing';
        this.showPage('landing');
    }

    exportResults() {
        // Create a canvas to draw the export graphic
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a0b2e');
        gradient.addColorStop(0.5, '#16041a');
        gradient.addColorStop(1, '#0f0a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sexuality Spectrum Assessment', canvas.width / 2, 80);

        // Get archetype info
        const archetypeName = document.getElementById('archetype-name').textContent;
        const archetypeEmoji = document.getElementById('archetype-emoji').textContent;
        const archetypeSubtitle = document.getElementById('archetype-subtitle').textContent;

        // Archetype name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px Arial';
        ctx.fillText(archetypeEmoji + ' ' + archetypeName, canvas.width / 2, 180);

        // Subtitle
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '32px Arial';
        ctx.fillText(archetypeSubtitle, canvas.width / 2, 230);

        // Coordinates
        const coordX = document.getElementById('coord-x').textContent;
        const coordY = document.getElementById('coord-y').textContent;
        const coordZ = document.getElementById('coord-z').textContent;

        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('3D Coordinates:', 100, 300);

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '24px Arial';
        ctx.fillText(`X-Axis (Masculine ↔ Feminine): ${coordX}`, 100, 345);
        ctx.fillText(`Y-Axis (Dominant ↔ Submissive): ${coordY}`, 100, 385);
        ctx.fillText(`Z-Axis (Romantic ↔ Physical): ${coordZ}`, 100, 425);

        // Capture the 3D visualization
        if (this.visualizer && this.visualizer.renderer) {
            try {
                // Render the scene
                this.visualizer.renderer.render(this.visualizer.scene, this.visualizer.camera);
                
                // Get the WebGL canvas
                const webglCanvas = this.visualizer.renderer.domElement;
                
                // Draw the 3D visualization onto our export canvas
                ctx.drawImage(webglCanvas, 100, 480, 1000, 750);
                
                // Add archetype reference dots legend
                ctx.fillStyle = '#fb923c';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('Legend: Your Position (large) | Other Archetypes (small dots)', 100, 1250);
            } catch (error) {
                console.error('Error capturing 3D visualization:', error);
                // Draw placeholder if capture fails
                ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
                ctx.fillRect(100, 480, 1000, 750);
                ctx.fillStyle = '#c084fc';
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('3D Visualization', canvas.width / 2, 855);
            }
        }

        // Get interpretation text
        const interpretationText = document.getElementById('interpretation-text').textContent
            .replace(/\s+/g, ' ')  // Replace multiple spaces/newlines with single space
            .trim();  // Remove leading/trailing whitespace
        
        // Draw interpretation (truncated if too long)
        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Interpretation:', 100, 1300);

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '20px Arial';
        const maxWidth = 1000;
        const lineHeight = 28;
        const words = interpretationText.substring(0, 500).split(' ').filter(w => w.length > 0);
        let line = '';
        let y = 1340;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line.trim(), 100, y);
                line = words[n] + ' ';
                y += lineHeight;
                if (y > 1520) break;
            } else {
                line = testLine;
            }
        }
        if (y <= 1520 && line.trim()) {
            ctx.fillText(line.trim() + '...', 100, y);
        }

        // Footer
        ctx.fillStyle = '#c084fc';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Generated from Sexuality Spectrum Assessment', canvas.width / 2, 1560);

        // Download the image
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sexuality-spectrum-results-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    saveProgress() {
        const progress = {
            currentQuestionIndex: this.currentQuestionIndex,
            responses: this.responses,
            currentPage: this.currentPage,
            quizVersion: this.quizVersion
        };
        localStorage.setItem('quizProgress', JSON.stringify(progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('quizProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.quizVersion = progress.quizVersion || 'demo';
            this.setQuestionSet();
            
            // Validate that saved index is within bounds
            const savedIndex = progress.currentQuestionIndex || 0;
            if (savedIndex >= 0 && savedIndex < QUESTIONS.length) {
                this.currentQuestionIndex = savedIndex;
                this.responses = progress.responses || [];
                
                // Only restore quiz page if there are valid responses
                if (progress.currentPage === 'quiz' && this.responses.length > 0) {
                    this.currentPage = 'quiz';
                }
            } else {
                // Invalid state - clear and start fresh
                console.warn('Invalid saved state detected, clearing...');
                localStorage.removeItem('quizProgress');
                this.currentQuestionIndex = 0;
                this.responses = [];
                this.currentPage = 'landing';
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SexualitySpectrumApp();
});
