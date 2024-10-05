const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const userModel = require("../modals/userModal");

const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const createUser = async (req, res) => {
  try {
    const { name, email, password } = await userSchema.validateAsync(req.body);

    //check user already exist
    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    //hash password
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT)
    );

    //save user info
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    //generate token using jsonwebtoken
    const token = await jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const role = req.query.role;

    //checking if role is admin get only admin details or get all details 
    const users = role
      ? await userModel.find({ role })
      : await userModel.find();

    res.json(users);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    //condition to not update other user's details
    if (req.user.userId !== id)
      return res
        .status(403)
        .json({ error: "Cannot update another user's data" });

    //update info    
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { name, email },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    //deleting user info
    const deletedUser = await userModel.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //find if user with given email present or not
    const userDb = await userModel.findOne({ email });

    if (!userDb) return res.status(401).json({ error: "Email is not found" });

    //if user present with email given email check for password 
    const isMatch = await bcrypt.compare(password, userDb.password);

    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    //generate token 
    const token = jwt.sign(
      { userId: userDb._id, role: userDb.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //generate a reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    //simulate sending the reset link via email
    console.log(
      `Password reset link: http://localhost:8000/reset-password/${resetToken}`
    );

    res
      .status(200)
      .json({ message: "Password reset link has been sent to your email." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { newPassword } = req.body;

    //verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    //hash the new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.SALT)
    );
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  login,
  requestPasswordReset,
  resetPassword,
};
