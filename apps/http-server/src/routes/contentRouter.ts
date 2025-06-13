import { Router } from "express";
import { authenticateUser } from "../middlewares/authenticateUser";
import { fetchAllChatMessages, fetchHomeInfo } from "../controllers/contentControllers";

const router = Router();

router.route("/home").get(authenticateUser, fetchHomeInfo);
router.route("/chat/:roomId").get(authenticateUser, fetchAllChatMessages);
router.route("/canvas").get(authenticateUser);

export default router;
