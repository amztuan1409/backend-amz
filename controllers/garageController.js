const Garage = require('../models/Garage');

// Thêm mới Garage
exports.addGarage = async (req, res) => {
  try {
    const { name, dropOff , pickUp} = req.body;

    // Kiểm tra xem garage đã tồn tại chưa
    const existingGarage = await Garage.findOne({ name });
    if (existingGarage) {
      return res.status(400).json({ message: 'Garage with this name already exists' });
    }

    const newGarage = new Garage({ name, dropOff });
    await newGarage.save();

    res.status(201).json({ message: 'Garage created successfully', garage: newGarage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Sửa Garage
exports.updateGarageById = async (req, res) => {
  try {
    const { garageId } = req.params;
    const updateData = req.body;

    // Kiểm tra xem garage có tồn tại không
    const existingGarage = await Garage.findById(garageId);
    if (!existingGarage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    // Cập nhật garage
    const updatedGarage = await Garage.findByIdAndUpdate(garageId, updateData, { new: true });

    res.status(200).json({ message: 'Garage updated successfully', garage: updatedGarage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Xóa Garage
exports.deleteGarageById = async (req, res) => {
  try {
    const { garageId } = req.params;

    // Kiểm tra xem garage có tồn tại không
    const existingGarage = await Garage.findById(garageId);
    if (!existingGarage) {
      return res.status(404).json({ message: 'Garage not found' });
    }

    // Xóa garage
    await Garage.findByIdAndDelete(garageId);

    res.status(200).json({ message: 'Garage deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAllGarages = async (req, res) => {
    try {
      const garages = await Garage.find();
      res.status(200).json(garages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  };