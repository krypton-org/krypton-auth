const UserController = require("../controllers/UserController");
const MiscellaneousController = require("../controllers/MiscellaneousController");
const express = require('express');
const router = express.Router();

router.get('/', MiscellaneousController.getIndex);
router.get('/user/email/confirmation', UserController.confirmEmail);
router.get('/form/reset/password', UserController.resetPasswordForm);


module.exports = router;