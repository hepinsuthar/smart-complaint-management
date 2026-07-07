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

const validCategories = [
    "Hostel",
    "Academics",
    "IT",
    "Library",
    "Transport",
    "Mess",
    "Other",
];

const validPriorities = ["Low", "Medium", "High", "Critical"];

function normalizeCategory(rawCategory) {
    if (!rawCategory || typeof rawCategory !== "string") {
        return null;
    }

    const lower = rawCategory.trim().toLowerCase();

    if (lower.includes("hostel")) {
        return "Hostel";
    }
    if (lower.includes("academic")) {
        return "Academics";
    }
    if (
        lower === "it" ||
        (lower.includes("it") && lower.includes("technical")) ||
        lower.includes("it / technical") ||
        lower.includes("it & technical")
    ) {
        return "IT";
    }
    if (lower.includes("library")) {
        return "Library";
    }
    if (lower.includes("transport")) {
        return "Transport";
    }
    if (lower.includes("mess")) {
        return "Mess";
    }
    if (lower.includes("other") || lower.includes("administration")) {
        return "Other";
    }

    return null;
}

function detectCategoryByKeyword(title, description) {
    const text = `${title || ""} ${description || ""}`.toLowerCase();

    const messKeywords = /mess|canteen|food|breakfast|lunch|dinner|menu|cook|kitchen|meal|snacks|food quality/;
    const itKeywords = /wifi|internet|network|computer|printer|software|server|website|portal|online|technical|hardware|desktop|laptop|router|modem|bandwidth|email|password|system|projector/;
    const academicKeywords = /exam|faculty|class|lecture|attendance|semester|course|curriculum|timetable|assignment|result|syllabus|professor|teacher|college|university|student/;
    const hostelKeywords = /hostel|room|water|fan|electricity|power|leak|sanitation|washroom|toilet|clean|door|window|bed|mattress|roommate/;
    const libraryKeywords = /library|book|books|study|reading room|research|journals|magazine/;
    const transportKeywords = /bus|transport|vehicle|van|driver|route|pickup|drop|schedule|travel|shuttle|road/;

    if (messKeywords.test(text)) return "Mess";
    if (itKeywords.test(text)) return "IT";
    if (libraryKeywords.test(text)) return "Library";
    if (transportKeywords.test(text)) return "Transport";
    if (academicKeywords.test(text)) return "Academics";
    if (hostelKeywords.test(text)) return "Hostel";
    return null;
}

function normalizePriority(rawPriority) {
    if (!rawPriority || typeof rawPriority !== "string") {
        return null;
    }

    const lower = rawPriority.trim().toLowerCase();
    if (lower === "low") return "Low";
    if (lower === "medium") return "Medium";
    if (lower === "high") return "High";
    if (lower === "critical") return "Critical";
    return null;
}

function isInvalidApiKeyError(err) {
    return (
        err &&
        err.status === 400 &&
        Array.isArray(err.errorDetails) &&
        err.errorDetails.some((detail) => detail.reason === "API_KEY_INVALID")
    );
}

function isRateLimitError(err) {
    return (
        err &&
        err.status === 429 &&
        Array.isArray(err.errorDetails) &&
        err.errorDetails.some((detail) => detail['@type']?.includes("QuotaFailure"))
    );
}

function handleAiError(err, fallback, action) {
    if (isInvalidApiKeyError(err)) {
        console.warn(`${action} skipped: invalid AI key. Falling back to default.`);
        return fallback;
    }

    if (isRateLimitError(err)) {
        console.warn(`${action} skipped: AI quota exceeded. Falling back to default.`);
        return fallback;
    }

    if (err && typeof err.message === "string" && err.message.includes("AI not configured")) {
        console.warn(`${action} skipped: AI not configured. Falling back to default.`);
        return fallback;
    }

    console.error(`${action} failed:`);
    console.error(err);
    throw err;
}

function getModel(action, fallback) {
    if (!model) {
        handleAiError(new Error("AI not configured"), fallback, action);
        return null;
    }
    return model;
}

async function askAI(prompt) {
    try {
        if (!model) {
            throw new Error("AI not configured");
        }
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error("ASK AI ERROR");
        console.error(err);
        throw err;
    }
}

async function detectPriority(title, description) {
    try {
        const currentModel = getModel("detectPriority", "Medium");
        if (!currentModel) return "Medium";

        const prompt = `
You are an AI Complaint Analyzer.

Title:
${title}

Description:
${description}

Return ONLY one of the following exact values:

Low
Medium
High
Critical
`;

        const result = await currentModel.generateContent(prompt);
        const normalizedPriority = normalizePriority(result.response.text().trim());

        if (!normalizedPriority) {
            console.warn(`PRIORITY WARNING: invalid AI priority returned: "${result.response.text().trim()}". Falling back to Medium.`);
            return "Medium";
        }

        return normalizedPriority;
    } catch (err) {
        console.error("PRIORITY ERROR");
        console.error(err);
        return handleAiError(err, "Medium", "detectPriority");
    }
}
async function detectCategory(title, description) {
    try {
        const currentModel = getModel("detectCategory", "Other");
        if (!currentModel) return "Other";

        const prompt = `
You are an AI complaint classifier.

Title:
${title}

Description:
${description}

Choose ONLY ONE exact category from this list:

Hostel
Academics
IT
Library
Transport
Mess
Other

Return ONLY the category value exactly as shown.
If the complaint does not clearly fit one of these, return Other.
`;

        const result = await currentModel.generateContent(prompt);
        const normalizedCategory = normalizeCategory(result.response.text().trim());

        if (!normalizedCategory) {
            console.warn(`CATEGORY WARNING: invalid AI category returned: "${result.response.text().trim()}". Falling back to Other.`);
            return "Other";
        }

        return normalizedCategory;
    } catch (err) {
        console.error("CATEGORY ERROR");
        console.error(err);
        return handleAiError(err, "Other", "detectCategory");
    }
}
async function assignFacultyAI(category) {
    try {
        const currentModel = getModel("assignFacultyAI", "General Administration");
        if (!currentModel) return "General Administration";

        const prompt = `
You are a complaint routing AI.

Category:
${category}

Choose the responsible department for this category.
Return ONLY one of the exact values below:

Hostel Department
Academic Department
IT & Technical Department
Library Department
Transport Department
Mess Department
General Administration
`;

        const result = await currentModel.generateContent(prompt);
        const response = result.response.text().trim();
        return response;
    } catch (err) {
        console.error("FACULTY AI ERROR");
        console.error(err);
        return handleAiError(err, "General Administration", "assignFacultyAI");
    }
}
async function estimateResolutionTime(title, description, priority) {
    try {
        const currentModel = getModel("estimateResolutionTime", 3);
        if (!currentModel) return 3;

        const prompt = `
You are an AI Complaint Resolution Expert.

Complaint Title:
${title}

Complaint Description:
${description}

Priority:
${priority}

Estimate how many days are required to resolve this complaint.

Return ONLY one integer.

Examples:

1
2
3
5
7

No explanation.
`;

        const result = await currentModel.generateContent(prompt);

        const value = parseInt(result.response.text().trim(), 10);
        return Number.isNaN(value) ? 3 : value;
    } catch (err) {

        console.error("ESTIMATE TIME ERROR");
        console.error(err);

        return handleAiError(err, 3, "estimateResolutionTime");
    }
}
module.exports = {
    askAI,
    detectPriority,
    detectCategory,
    detectCategoryByKeyword,
    assignFacultyAI,
    estimateResolutionTime,
};