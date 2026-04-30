const express = require("express");
const router = express.Router();
const {
  getAllRepairs, getRepairById, createRepair,
  updateRepair, deleteRepair, takeRepair, resoudreRepair
} = require("../controllers/repair_controller");
const { getMessages, sendMessage } = require("../controllers/message_controller");
const { noterReparateur, getNotationRepair } = require("../controllers/notation_controller");
const { requireAuth } = require("../middleware/auth_middleware");

router.get("/",            getAllRepairs);
router.get("/:id",         getRepairById);
router.post("/",           requireAuth, createRepair);
router.put("/:id",         requireAuth, updateRepair);
router.delete("/:id",      requireAuth, deleteRepair);
router.post("/:id/take",   requireAuth, takeRepair);
router.post("/:id/resoudre", requireAuth, resoudreRepair);

// Messagerie
router.get("/:id/messages",  requireAuth, getMessages);
router.post("/:id/messages", requireAuth, sendMessage);

// Notation
router.get("/:id/notation",  getNotationRepair);
router.post("/:id/noter",    requireAuth, noterReparateur);

module.exports = router;
