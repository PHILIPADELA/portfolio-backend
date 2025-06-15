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

    const formattedDate = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
            body {
              font-family: 'Poppins', 'Roboto', 'Helvetica', Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #fff3e0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #1976d2;
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              margin: -20px -20px 20px -20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 0 20px;
            }
            .field {
              margin-bottom: 15px;
            }
            .field-label {
              color: #1a237e;
              font-weight: 600;
              font-size: 14px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .field-value {
              color: #455a64;
              font-size: 16px;
              background-color: #fff8e8;
              padding: 10px;
              border-radius: 4px;
              border-left: 3px solid #1976d2;
            }
            .message-box {
              margin-top: 20px;
              padding: 15px;
              background-color: #fff8e8;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ffe0b2;
              color: #455a64;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">From</div>
                <div class="field-value">${name} (${email})</div>
              </div>
              
              <div class="field">
                <div class="field-label">Subject</div>
                <div class="field-value">${subject}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Message</div>
                <div class="field-value message-box">${message}</div>
              </div>
              
              <div class="footer">
                Received on: ${formattedDate}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendMail({
      to: 'adeyekunadelola0@gmail.com',
      subject: `New Contact Form Message: ${subject}`,
      html: emailContent, 
      text: `New message from ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}\n\nReceived on: ${formattedDate}` 
    });

    res.status(201).json({ message: 'Message received successfully' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
};
