const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");

const User = require("../models/users");

const { HttpError } = require("../helpers");

const { ctrlWrapper } = require("../decorators");
const avatarsDir = path.resolve("public", "avatars");

const { JWT_SECRET } = process.env;

const signup = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email already exist");
  }

  const hashPassword = await bcrypt.hash(password, 10);

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
  });

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
};
