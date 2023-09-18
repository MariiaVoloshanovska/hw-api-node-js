const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const User = require("../models/users");

const { HttpError, sendEmail } = require("../helpers");

const { ctrlWrapper } = require("../decorators");
const avatarsDir = path.resolve("public", "avatars");

const { JWT_SECRET, PROJECT_URL } = process.env;

const signup = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email already exist");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationCode = crypto.randomUUID();

  if (req.file) {
    const { path: oldPath, filename } = req.file;
    const newPath = path.join(avatarsPath, filename);
    await fs.rename(oldPath, newPath);
    avatarURL = path.join("avatars", filename);
  } else {
    avatarURL = gravatar.url(email);
  }
  const newUser = await User.create({
    ...req.body,
    avatarURL,
    password: hashPassword,
    verificationCode,
  });

  const verifyEmail = {
    to: email,
    subject: "test",
    html: `<a href="${PROJECT_URL}/api/auth/verify/${verificationCode}" target="_blanc">
        hello from node
      </a>`,
  };

  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: oldPath, filename } = req.file;

  const newPath = path.join(avatarsDir, filename);

  const updatedAvatar = await Jimp.read(oldPath);
  updatedAvatar.resize(250, 250);
  updatedAvatar.write(newPath);

  await fs.unlink(oldPath);
  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({
    avatarURL,
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password invalid");
  }
  if (!user.verify) {
    throw HttpError(401, "email nor verified");
  }
};

const verify = async (req, res) => {
  const { verificationCode } = req.params;
  const user = await User.findOne({ verificationCode });
  if (!user) {
    throw HttpError(401, "user not exist");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationCode: "",
  });
  res.json({
    message: "verification successful",
  });
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
  });
};

const resend = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, "Email not found");
  }

  if (user.verify) {
    throw HttpError(400, "Email already verify");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a href="${PROJECT_URL}/api/auth/verify/${user.verificationCode}" target="_blank">
        Click verify email
      </a>`,
  };
  await sendEmail(verifyEmail);

  res.json({
    message: "Verify email success send",
  });
};

const getCurrent = (req, res) => {
  const { name, email } = req.user;

  res.json({
    name,
    email,
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.json({
    message: "Signuot success",
  });
};

module.exports = {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  getCurrent: ctrlWrapper(getCurrent),
  signout: ctrlWrapper(signout),
  updateAvatar: ctrlWrapper(updateAvatar),
  verify: ctrlWrapper(verify),
  resend: ctrlWrapper(resend),
};
