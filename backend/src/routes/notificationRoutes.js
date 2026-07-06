const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { getNotifications, deleteNotification } = require("../controllers/notificationController");

router.get("/", auth, getNotifications);
router.delete("/:id", auth, deleteNotification);

module.exports = router;
