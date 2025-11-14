import { Router } from "express";
import { endpointTest } from "./test.js";
import { endpointRPG } from "./rpg.js";
import { endpointCompletion } from "./completion.js"
const router = Router();

router.get("/test", endpointTest);
router.post("/chat/rpg", endpointRPG);
router.post("/chat/completion",endpointCompletion)

export default router;
