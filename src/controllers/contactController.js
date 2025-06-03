const Contact = require('../models/Contact');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    
    const contact = new Contact({
      name,
      email,
      subject,
      message
    });

    
    await contact.save();

    res.status(201).json({ message: 'Message received successfully' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
};
