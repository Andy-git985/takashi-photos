const bcrypt = require("bcrypt");
const Config = require("../models/Config");
const ImageOrder = require("../models/ImageOrder");
const User = require("../models/User");

const checkAdminPresence = async (req, res) => {
  const config = await Config.findOne({});
  if (!config?.adminCreated) {
    return res.status(200).json({ status: "admin not present" });
  }
  res.status(200).json({ status: "admin created" });
};

const createAdmin = async (req, res) => {
  const { email, password } = req.body;
  const config = await Config.findOne();

  if (!config.adminCreated) {
    config.adminCreated = true;
    await config.save();
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      error: "email must be unique",
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  const user = new User({
    email,
    passwordHash,
    role: "admin",
  });

  const savedUser = await user.save();
  res.status(201).json(savedUser);
};

module.exports = {
  checkAdminPresence,
  createAdmin,
};
