require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {

    console.log(process.env.GEMINI_API_KEY);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
    });

    const result = await model.generateContent("Hello");

    console.log(result.response.text());

}

test();