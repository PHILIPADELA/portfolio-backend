const Contact = require('../models/Contact');
const { sendMail } = require('../utils/email');

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

   
    const emailContent = `
      New Contact Form Submission

      From: ${name} (${email})
      Subject: ${subject}

      Message:
      ${message}

      Received on: ${new Date().toLocaleString()}
    `;

    await sendMail({
      to: 'adeyekunadelola0@gmail.com', 
      subject: `New Contact Form Message: ${subject}`,
      text: emailContent
    });

    res.status(201).json({ message: 'Message received successfully' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
};
