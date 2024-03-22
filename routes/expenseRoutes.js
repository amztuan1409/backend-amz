const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isEmployee } = require('../middleware/authMiddleware');

const expenseController = require('../controllers/expenseController');

router.post('/create' ,verifyToken, expenseController.createExpense)

router.get('/' , expenseController.getAllExpenses)

module.exports = router;
