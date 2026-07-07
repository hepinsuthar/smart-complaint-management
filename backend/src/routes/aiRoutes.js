const express = require("express");
const router = express.Router();
const { askAI } = require("../services/aiService");

router.post("/ask", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                error: "Prompt is required",
            });
        }

        const reply = await askAI(prompt);

        res.json({
            reply,
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err.message,
        });
    }
});

module.exports = router;