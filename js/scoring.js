// Scoring Logic for Sexuality Spectrum Quiz

class QuizScorer {
    constructor(responses, quizVersion = 'middle') {
        this.responses = responses; // Array of {questionId, value} objects
        this.quizVersion = quizVersion;
        
        // Calculate max possible score based on quiz version
        this.maxScore = this.calculateMaxScore();
        
        // Standard range for all comparisons
        this.STANDARD_MAX = 24;
    }

    // Calculate maximum possible score for current quiz
    calculateMaxScore() {
        const questionsPerAxis = {
            'demo': 3,        // 8 total questions, ~3 per axis, max = 3 × 2 = 6 per axis
            'middle': 12,     // 36 total questions, 12 per axis, max = 12 × 2 = 24 per axis
            'comprehensive': 20  // 60 total questions, 20 per axis, max = 20 × 2 = 40 per axis
        };
        
        const count = questionsPerAxis[this.quizVersion] || 12;
        return count * 2; // Each question can score -2 to +2
    }

    // Normalize score to standard range (-24 to +24)
    normalizeScore(score) {
        return (score / this.maxScore) * this.STANDARD_MAX;
    }

    // Determine category for an axis score using STANDARD thresholds
    getAxisCategory(axis, score) {
        // ALWAYS use standard threshold of 6 (25% of standard max 24)
        const threshold = this.STANDARD_MAX * 0.25; // Always 6
        
        if (score < -threshold) return 'low';
        if (score > threshold) return 'high';
        return 'balanced';
    }

    // Convert Likert value (1-5) to score (-2 to +2)
    likertToScore(value) {
        const scoreMap = {
            1: -2,
            2: -1,
            3: 0,
            4: 1,
            5: 2
        };
        return scoreMap[value];
    }

    // Calculate score for a specific axis
    calculateAxisScore(axis) {
        const axisQuestions = QUESTIONS.filter(q => q.axis === axis);
        let totalScore = 0;

        axisQuestions.forEach(question => {
            const response = this.responses.find(r => r.questionId === question.id);
            if (response) {
                let score = this.likertToScore(response.value);
                // Reverse scoring if needed
                if (question.reverse) {
                    score = -score;
                }
                totalScore += score;
            }
        });

        return totalScore;
    }

    // Calculate all three axis scores
    calculateScores() {
        return {
            x: this.calculateAxisScore('x'), // Masculine (-24) ↔ Feminine (+24)
            y: this.calculateAxisScore('y'), // Dominant (-24) ↔ Submissive (+24)
            z: this.calculateAxisScore('z')  // Romantic (-24) ↔ Physical (+24)
        };
    }

    // Get interpretation for a specific axis score
    getAxisInterpretation(axis, score) {
        const interpretations = {
            x: {
                range: [-24, 24],
                negative: "Masculine-leaning",
                positive: "Feminine-leaning",
                descriptions: [
                    { min: -24, max: -16, text: "Strongly masculine-leaning" },
                    { min: -15, max: -8, text: "Moderately masculine-leaning" },
                    { min: -7, max: -3, text: "Slightly masculine-leaning" },
                    { min: -2, max: 2, text: "Balanced/Neutral" },
                    { min: 3, max: 7, text: "Slightly feminine-leaning" },
                    { min: 8, max: 15, text: "Moderately feminine-leaning" },
                    { min: 16, max: 24, text: "Strongly feminine-leaning" }
                ]
            },
            y: {
                range: [-24, 24],
                negative: "Dominant-leaning",
                positive: "Submissive-leaning",
                descriptions: [
                    { min: -24, max: -16, text: "Strongly dominant-leaning" },
                    { min: -15, max: -8, text: "Moderately dominant-leaning" },
                    { min: -7, max: -3, text: "Slightly dominant-leaning" },
                    { min: -2, max: 2, text: "Balanced/Switch" },
                    { min: 3, max: 7, text: "Slightly submissive-leaning" },
                    { min: 8, max: 15, text: "Moderately submissive-leaning" },
                    { min: 16, max: 24, text: "Strongly submissive-leaning" }
                ]
            },
            z: {
                range: [-24, 24],
                negative: "Romantic-leaning",
                positive: "Physical chemistry-driven",
                descriptions: [
                    { min: -24, max: -16, text: "Strongly romantic-leaning" },
                    { min: -15, max: -8, text: "Moderately romantic-leaning" },
                    { min: -7, max: -3, text: "Slightly romantic-leaning" },
                    { min: -2, max: 2, text: "Balanced" },
                    { min: 3, max: 7, text: "Slightly physical chemistry-driven" },
                    { min: 8, max: 15, text: "Moderately physical chemistry-driven" },
                    { min: 16, max: 24, text: "Strongly physical chemistry-driven" }
                ]
            }
        };

        const axisInfo = interpretations[axis];
        const description = axisInfo.descriptions.find(d => score >= d.min && score <= d.max);
        return description ? description.text : "Neutral";
    }

    // Determine user's archetype based on 3D position
    getArchetype(scores) {
        const xCat = this.getAxisCategory('x', scores.x);
        const yCat = this.getAxisCategory('y', scores.y);
        const zCat = this.getAxisCategory('z', scores.z);

        // Get coordinate ranges for display (ALWAYS use standard range of 24 for archetypes)
        const STANDARD_MAX = 24;
        const threshold = STANDARD_MAX * 0.25; // 6
        const getRanges = (cat) => {
            if (cat === 'low') return {
                x: `[-${STANDARD_MAX}, -${Math.ceil(threshold)}]`,
                y: `[-${STANDARD_MAX}, -${Math.ceil(threshold)}]`,
                z: `[-${STANDARD_MAX}, -${Math.ceil(threshold)}]`
            };
            if (cat === 'balanced') return {
                x: `[-${Math.floor(threshold)}, ${Math.floor(threshold)}]`,
                y: `[-${Math.floor(threshold)}, ${Math.floor(threshold)}]`,
                z: `[-${Math.floor(threshold)}, ${Math.floor(threshold)}]`
            };
            return {
                x: `[${Math.ceil(threshold)}, ${STANDARD_MAX}]`,
                y: `[${Math.ceil(threshold)}, ${STANDARD_MAX}]`,
                z: `[${Math.ceil(threshold)}, ${STANDARD_MAX}]`
            };
        };

        const ranges = {
            x: getRanges(xCat).x,
            y: getRanges(yCat).y,
            z: getRanges(zCat).z
        };

        // 27 archetypes based on 3x3x3 combinations
        const archetypes = {
            // Masculine archetypes
            'low-low-low': { name: 'The Noble Protector', emoji: '🔱', description: 'Masculine, dominant energy with deep romantic connection. You lead with strength while valuing emotional intimacy and tender moments.', ranges },
            'low-low-balanced': { name: 'The Balanced Warrior', emoji: '⚔️', description: 'Masculine dominant presence balancing romance and passion. You protect and lead while appreciating both emotional depth and physical chemistry.', ranges },
            'low-low-high': { name: 'The Primal Dominant', emoji: '⚡', description: 'Masculine, commanding presence driven by physical chemistry. You lead with confidence and intensity, valuing raw attraction and powerful connection.', ranges },
            'low-balanced-low': { name: 'The Gentle Guardian', emoji: '🌙', description: 'Masculine switch with romantic soul. You move fluidly between leading and following, always prioritizing emotional connection.', ranges },
            'low-balanced-balanced': { name: 'The Versatile Masculine', emoji: '🎯', description: 'Masculine energy with adaptable power dynamics. You balance all aspects of intimacy with confidence and flexibility.', ranges },
            'low-balanced-high': { name: 'The Passionate Masculine', emoji: '🔥', description: 'Masculine switch driven by physical chemistry. You blend strength with adaptability, valuing intense physical connection.', ranges },
            'low-high-low': { name: 'The Devoted Romantic', emoji: '🌊', description: 'Masculine submissive with romantic heart. You surrender with grace while maintaining masculine energy, valuing deep emotional bonds.', ranges },
            'low-high-balanced': { name: 'The Trusting Masculine', emoji: '💫', description: 'Masculine submissive balancing connection styles. You yield with confidence, comfortable with both romance and passion.', ranges },
            'low-high-high': { name: 'The Intense Surrender', emoji: '🌋', description: 'Masculine submissive driven by physical desire. You surrender to intense chemistry while maintaining your masculine core.', ranges },

            // Balanced/Androgynous archetypes
            'balanced-low-low': { name: 'The Romantic Leader', emoji: '🦋', description: 'Androgynous dominant with romantic soul. You lead from a place of balance, valuing emotional depth and authentic connection.', ranges },
            'balanced-low-balanced': { name: 'The Sovereign Presence', emoji: '👑', description: 'Balanced dominant energy comfortable with all forms of intimacy. You command respect while remaining open to both romance and passion.', ranges },
            'balanced-low-high': { name: 'The Dynamic Leader', emoji: '💥', description: 'Androgynous dominant driven by chemistry. You lead with confidence and intensity, prioritizing physical connection.', ranges },
            'balanced-balanced-low': { name: 'The Fluid Romantic', emoji: '🌸', description: 'Complete balance with romantic heart. You flow between all energies with grace, always seeking emotional connection.', ranges },
            'balanced-balanced-balanced': { name: 'The Harmonious Soul', emoji: '✨', description: 'Perfect equilibrium across all dimensions. You embody complete balance and adaptability in all aspects of intimacy.', ranges },
            'balanced-balanced-high': { name: 'The Playful Switch', emoji: '🎭', description: 'Balanced and versatile, driven by chemistry. You explore all dynamics with curiosity and passion.', ranges },
            'balanced-high-low': { name: 'The Tender Dreamer', emoji: '🌹', description: 'Androgynous submissive romantic. You surrender with grace and sensitivity, valuing emotional intimacy above all.', ranges },
            'balanced-high-balanced': { name: 'The Graceful Yielder', emoji: '💎', description: 'Balanced submissive comfortable with all connection styles. You yield with elegance and openness.', ranges },
            'balanced-high-high': { name: 'The Sensual Surrender', emoji: '🔮', description: 'Androgynous submissive driven by physical desire. You embrace intensity and chemistry in your surrender.', ranges },

            // Feminine archetypes
            'high-low-low': { name: 'The Feminine Dominant', emoji: '🌺', description: 'Feminine energy with commanding presence and romantic heart. You lead with grace and emotional intelligence.', ranges },
            'high-low-balanced': { name: 'The Commanding Feminine', emoji: '💃', description: 'Feminine dominant balancing romance and passion. You take charge with elegance and confidence.', ranges },
            'high-low-high': { name: 'The Fierce Goddess', emoji: '🔥', description: 'Feminine dominant driven by chemistry. You command with sensual power and magnetic intensity.', ranges },
            'high-balanced-low': { name: 'The Romantic Feminine', emoji: '🦢', description: 'Feminine switch with romantic soul. You flow between roles with grace, always prioritizing emotional depth.', ranges },
            'high-balanced-balanced': { name: 'The Balanced Feminine', emoji: '🌙', description: 'Feminine energy with complete adaptability. You embrace all dynamics while maintaining your feminine essence.', ranges },
            'high-balanced-high': { name: 'The Passionate Feminine', emoji: '💋', description: 'Feminine switch driven by chemistry. You blend grace with intensity, valuing powerful physical connection.', ranges },
            'high-high-low': { name: 'The Tender Soul', emoji: '🌷', description: 'Feminine submissive romantic. You surrender with elegance and emotional depth, seeking profound connection.', ranges },
            'high-high-balanced': { name: 'The Graceful Romantic', emoji: '💖', description: 'Feminine submissive balancing connection styles. You yield with beauty and openness to all forms of intimacy.', ranges },
            'high-high-high': { name: 'The Sensual Flame', emoji: '🌶️', description: 'Feminine submissive driven by passion. You surrender to intense chemistry with grace and desire.', ranges }
        };

        const key = `${xCat}-${yCat}-${zCat}`;
        return archetypes[key] || { name: 'The Unique Soul', emoji: '✨', description: 'Your unique combination creates a one-of-a-kind profile.', ranges };
    }

    // Get compatible archetypes based on user's position
    getCompatibleArchetypes(scores) {
        const userCat = {
            x: this.getAxisCategory('x', scores.x),
            y: this.getAxisCategory('y', scores.y),
            z: this.getAxisCategory('z', scores.z)
        };

        const compatible = [];

        // Similarity on X and Z, Complementarity on Y
        const xOptions = [userCat.x]; // Same or adjacent
        const yOptions = userCat.y === 'low' ? ['high'] : 
                        userCat.y === 'high' ? ['low'] : 
                        ['low', 'balanced', 'high']; // Switch is compatible with all
        const zOptions = [userCat.z]; // Same preferred

        // Add some flexibility
        if (userCat.x === 'balanced') xOptions.push('low', 'high');
        if (userCat.z === 'balanced') zOptions.push('low', 'high');

        // Generate compatible archetype keys
        // Use mid-point of each category for display (using standard range)
        const STANDARD_MAX = 24;
        const threshold = STANDARD_MAX * 0.25; // 6
        const getMidScore = (cat) => {
            if (cat === 'low') return (-STANDARD_MAX + -threshold) / 2; // -15
            if (cat === 'high') return (threshold + STANDARD_MAX) / 2; // +15
            return 0;
        };

        for (const x of xOptions) {
            for (const y of yOptions) {
                for (const z of zOptions) {
                    const archetype = this.getArchetype({ 
                        x: getMidScore(x),
                        y: getMidScore(y),
                        z: getMidScore(z)
                    });
                    if (archetype && !compatible.find(a => a.name === archetype.name)) {
                        compatible.push(archetype);
                    }
                }
            }
        }

        return compatible.slice(0, 6); // Return top 6
    }

    // Generate a comprehensive interpretation
    generateInterpretation(scores) {
        // Normalize scores to standard range for archetype determination
        const normalizedScores = {
            x: this.normalizeScore(scores.x),
            y: this.normalizeScore(scores.y),
            z: this.normalizeScore(scores.z)
        };

        // Use NORMALIZED scores for archetype and compatibility
        const archetype = this.getArchetype(normalizedScores);
        const compatibleTypes = this.getCompatibleArchetypes(normalizedScores);

        // Keep raw scores for display, but use normalized for interpretations
        const interpretations = {
            x: this.getAxisInterpretation('x', normalizedScores.x),
            y: this.getAxisInterpretation('y', normalizedScores.y),
            z: this.getAxisInterpretation('z', normalizedScores.z)
        };

        const summary = `
            <div class="interpretation-summary">
                <p>Your position in the 3D spectrum reveals a unique profile shaped by your preferences across three key dimensions of intimacy and attraction.</p>
                
                <div class="archetype-description">
                    <p><strong>Core Values:</strong> ${archetype.description}</p>
                </div>
                
                <div class="axis-interpretations">
                    <div class="axis-interpretation">
                        <h4>Gender Expression (X-Axis)</h4>
                        <p>Score: <strong>${scores.x.toFixed(1)}</strong> (Normalized: ${normalizedScores.x.toFixed(1)}) - ${interpretations.x}</p>
                        <p class="axis-description">This reflects your comfort with traditionally masculine or feminine traits and behaviors.</p>
                    </div>
                    
                    <div class="axis-interpretation">
                        <h4>Power Dynamics (Y-Axis)</h4>
                        <p>Score: <strong>${scores.y.toFixed(1)}</strong> (Normalized: ${normalizedScores.y.toFixed(1)}) - ${interpretations.y}</p>
                        <p class="axis-description">This indicates your preferences regarding control and power dynamics in intimate relationships.</p>
                    </div>
                    
                    <div class="axis-interpretation">
                        <h4>Connection Style (Z-Axis)</h4>
                        <p>Score: <strong>${scores.z.toFixed(1)}</strong> (Normalized: ${normalizedScores.z.toFixed(1)}) - ${interpretations.z}</p>
                        <p class="axis-description">This shows whether you prioritize emotional connection versus physical chemistry.</p>
                    </div>
                </div>
            </div>
        `;

        return {
            scores, // Keep raw scores for reference
            normalizedScores, // Add normalized scores for visualization
            interpretations,
            archetype,
            compatibleTypes,
            summary
        };
    }
}

// Normalize scores to -1 to +1 range (optional, for visualization)
function normalizeScore(score, min = -24, max = 24) {
    return score / max;
}
