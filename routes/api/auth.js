const express = require("express");

const ctrl = require("../../controllers/auth");

const { validateBody } = require("../../decorators");
const schemas = require("../../schemas/users");

const { authenticate, upload } = require("../../middlewares");

const signupValidateMiddleware = validateBody(schemas.userSignupSchema);
const signinValidateMiddleware = validateBody(schemas.userSigninSchema);
const emailValidateMiddleware = validateBody(schemas.userEmailSchema);

const router = express.Router();

router.post("/signup", signupValidateMiddleware, ctrl.signup);

router.post("/signin", signinValidateMiddleware, ctrl.signin);
router.get("/verify/:verificationCode", ctrl.verify);
router.post("/verify", emailValidateMiddleware, ctrl.resend);

router.get("/current", authenticate, ctrl.getCurrent);

router.post("/signout", authenticate, ctrl.signout);
router.patch("/avatars", authenticate, upload.single("avatar"), ctrl.updateAvatar);

module.exports = router;
