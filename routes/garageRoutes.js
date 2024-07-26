const express = require('express');
const router = express.Router();
const garageController = require('../controllers/garageController');

router.post('/', garageController.addGarage);
router.put('/:garageId', garageController.updateGarageById);
router.delete('/:garageId', garageController.deleteGarageById);
router.get('/', garageController.getAllGarages);

module.exports = router;
