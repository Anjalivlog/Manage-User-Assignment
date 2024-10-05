const express = require("express");
const { createUser, getUsers, updateUser, deleteUser, login, requestPasswordReset, resetPassword } = require("../controllers/userController");
const { authenticateUser, authorizeAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post('/users', createUser);
router.get('/users', authenticateUser, getUsers);
router.put('/users/:id', authenticateUser, updateUser);
router.delete('/users/:id', authenticateUser, authorizeAdmin, deleteUser);
router.post('/login', login);

//additional function
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);


module.exports = router;