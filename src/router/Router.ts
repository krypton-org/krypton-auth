import UserController from "../controllers/UserController";
import MiscellaneousController from "../controllers/MiscellaneousController";
import express from'express';
const router = express.Router();

router.get('/', MiscellaneousController.getIndex);
router.get('/user/email/confirmation', UserController.confirmEmail);
router.get('/form/reset/password', UserController.resetPasswordForm);

export default router;