const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

router.get('/', categoriesController.getAll);
router.post('/', categoriesController.create);

module.exports = router;