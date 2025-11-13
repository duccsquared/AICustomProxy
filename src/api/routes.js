import { Router } from "express";
import { endpointTest } from "./test.js";
import { endpointRPG } from "./rpg.js";
const router = Router();

router.get("/test", endpointTest);
router.post("/chat/rpg", endpointRPG);


export default router;
