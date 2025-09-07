import { Router } from "express";
import { endpointTest } from "./test.js";
import { endpointCompletion } from "./completion.js";
const router = Router();

router.get("/test", endpointTest);
router.post("/chat/completions", endpointCompletion);


export default router;
