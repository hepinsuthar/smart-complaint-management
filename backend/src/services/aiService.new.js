const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const isAiConfigured = Boolean(apiKey);

if (!isAiConfigured) {
    console.warn("AI service disabled: no GEMINI_API_KEY or GOOGLE_API_KEY configured.");
} else {
    console.log("AI Key Loaded:", `${apiKey.slice(0, 8)}...`);
}

let model;
if (isAiConfigured) {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
    });
}

function normalizeText(result, fallback) {
    if (!result || !result.response || typeof result.response.text !== "function") {
        return fallback;
    }
    const text = result.response.text();
    return typeof text === "string" ? text.trim() : fallback;
}

function isApiKeyInvalidError(err) {
    return (
        err &&
        err.status === 400 &&
        Array.isArray(err.errorDetails) &&
        err.errorDetails.some((detail) => detail.reason === "API_KEY_INVALID")
    );
}

async function generateContent(prompt, fallback, options = {}) {
    const { allowFallback = false, action = "AI request" } = options;

    if (!isAiConfigured) {
        const message = `${action} skipped: AI key is not configured.`;
        console.warn(message);
        if (allowFallback) return fallback;
        throw new Error(message);
    }

    try {
        const result = await model.generateContent(prompt);
        return normalizeText(result, fallback);
    } catch (err) {
        if (isApiKeyInvalidError(err)) {
            console.error(`${action} failed: invalid AI key. Falling back to defaults.`);
            if (allowFallback) return fallback;
            throw new Error("AI key invalid or expired.");
        }

        console.error(`${action} failed:`);
        console.error(err);
        if (allowFallback) return fallback;
        throw err;
    }
}

async function askAI(prompt) {
    if (!prompt) {
        throw new Error("Prompt is required.");
    }
    return generateContent(prompt, null, { allowFallback: false, action: "askAI" });
}

async function detectPriority(title, description) {
    const prompt = `
You are an AI Complaint Analyzer.

Title:
${title}

Description:
${description}

Return ONLY one word.

Low
Medium
High
Critical
`;
    return generateContent(prompt, "Medium", {
        allowFallback: true,
        action: "detectPriority",
    });
}

async function detectCategory(title, description) {
    const prompt = `
You are an AI Complaint Categorizer.

Title:
${title}

Description:
${description}

Return exactly one category from the list below.

Hostel Department
Academic Department
IT & Technical Department
Library Department
Transport Department
Mess Department
General Administration
`;
    return generateContent(prompt, "General Administration", {
        allowFallback: true,
        action: "detectCategory",
    });
}

async function assignFacultyAI(title, description, category) {
    const prompt = `
You are an AI Faculty Assigner for a college complaint system.

Category:
${category}

Title:
${title}

Description:
${description}

Return exactly one department name from the categories used in the system.
`;
    return generateContent(prompt, category || "General Administration", {
        allowFallback: true,
        action: "assignFacultyAI",
    });
}

function estimateResolutionFromRules(priority) {
    if (!priority) {
        return 5;
    }
    const normalizedPriority = priority.toLowerCase();
    if (normalizedPriority === "critical") return 1;
    if (normalizedPriority === "high") return 2;
    if (normalizedPriority === "medium") return 4;
    if (normalizedPriority === "low") return 7;
    return 5;
}

async function estimateResolutionTime(priority, category) {
    const prompt = `
You are an AI resolution estimator for a college complaint system.

Complaint category: ${category}
Complaint priority: ${priority}

Return only a single number of days required to resolve this complaint.
`;
    const result = await generateContent(prompt, null, {
        allowFallback: true,
        action: "estimateResolutionTime",
    });
    const days = parseInt(result, 10);
    if (Number.isNaN(days) || days <= 0) {
        return estimateResolutionFromRules(priority);
    }
    return days;
}

module.exports = {
    askAI,
    detectPriority,
    detectCategory,
    assignFacultyAI,
    estimateResolutionTime,
};
