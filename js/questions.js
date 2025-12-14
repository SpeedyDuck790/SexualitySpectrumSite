// Questions for the Sexuality Spectrum Quiz
// Questions are loaded from JSON files for better storage and maintainability

// Active questions set (will be loaded based on user selection)
let QUESTIONS = [];

// Question sets cache
let QUESTIONS_DEMO = [];
let QUESTIONS_MIDDLE = [];
let QUESTIONS_COMPREHENSIVE = [];

// Load question sets from JSON files
async function loadQuestionSets() {
    try {
        const [demoResponse, middleResponse, comprehensiveResponse] = await Promise.all([
            fetch('data/questions-demo.json'),
            fetch('data/questions-middle.json'),
            fetch('data/questions-comprehensive.json')
        ]);

        QUESTIONS_DEMO = await demoResponse.json();
        QUESTIONS_MIDDLE = await middleResponse.json();
        QUESTIONS_COMPREHENSIVE = await comprehensiveResponse.json();

        // Set default to demo
        QUESTIONS = QUESTIONS_DEMO;

        return true;
    } catch (error) {
        console.error('Error loading question sets:', error);
        return false;
    }
}

// Function to get the correct question set
function getQuestionSet(version) {
    switch(version) {
        case 'demo':
            return QUESTIONS_DEMO;
        case 'middle':
            return QUESTIONS_MIDDLE;
        case 'comprehensive':
            return QUESTIONS_COMPREHENSIVE;
        default:
            return QUESTIONS_DEMO;
    }
}

// Likert scale options
const LIKERT_SCALE = [
    { value: 1, label: "Strongly Disagree", score: -2 },
    { value: 2, label: "Disagree", score: -1 },
    { value: 3, label: "Neutral", score: 0 },
    { value: 4, label: "Agree", score: 1 },
    { value: 5, label: "Strongly Agree", score: 2 }
];
