// Import the Report model
const Report = require('../models/Report'); // Update the path according to your project structure

// getAllReports controller function
exports.getAllReports = async (req, res) => {
  try {
    // Retrieve all reports from the database
    const reports = await Report.find({});

    // Send the reports back as a JSON response
    res.status(200).json({
      status: 'success',
      results: reports.length,
      data: {
        reports
      }
    });
  } catch (err) {
    // Handle possible errors
    res.status(500).json({
      status: 'error',
      message: 'Server error: ' + err.message
    });
  }
};
