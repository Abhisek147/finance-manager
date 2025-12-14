const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/monthly', reportsController.getMonthly);
router.get('/categories', reportsController.getCategories);
router.get('/predict', reportsController.getPredict);

module.exports = router;