const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password' // Use app password, not regular password
    }
});

// Log requests
const logRequest = (req, data = '') => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        method: req.method,
        url: req.url,
        body: data,
        userAgent: req.get('User -Agent')
    };
    
    const logString = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync('logs/requests.log', logString);
};

// API Routes
app.post('/api/contact', (req, res) => {
    logRequest(req, req.body);
    
    const { name, email, phone, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !phone || !subject || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Create email content
    const mailOptions = {
        from: email,
        to: 'mathew.modernsurgiments@gmail.com',
        subject: `New Contact Form Submission: ${subject}`,
        text: `
            Name: ${name}
            Email: ${email}
            Phone: ${phone}
            Subject: ${subject}
            
            Message:
            ${message}
            
            Submitted on: ${new Date().toString()}
        `,
        html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p><em>Submitted on: ${new Date().toString()}</em></p>
        `
    };
    
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error sending message. Please try again later.' 
            });
        }
        
        // Send confirmation email to user
        const confirmationMail = {
            from: 'mathew.modernsurgiments@gmail.com',
            to: email,
            subject: 'Thank you for contacting Modern Surgiments',
            text: `
                Dear ${name},
                
                Thank you for contacting Modern Surgiments. We have received your message and will get back to you soon.
                
                Here are the details you submitted:
                Name: ${name}
                Email: ${email}
                Phone: ${phone}
                Subject: ${subject}
                Message: ${message}
                
                We typically respond within 24-48 hours.
                
                Best regards,
                Modern Surgiments Team
            `,
            html: `
                <p>Dear ${name},</p>
                <p>Thank you for contacting <strong>Modern Surgiments</strong>. We have received your message and will get back to you soon.</p>
                <h3>Your Submission Details:</h3>
                <ul>
                    <li><strong>Name:</strong> ${name}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Phone:</strong> ${phone}</li>
                    <li><strong>Subject:</strong> ${subject}</li>
                    <li><strong>Message:</strong> ${message}</li>
                </ul>
                <p>We typically respond within <strong>24-48 hours</strong>.</p>
                <p>Best regards,<br><strong>Modern Surgiments Team</strong></p>
            `
        };
        
        transporter.sendMail(confirmationMail, (confirmError) => {
            if (confirmError) {
                console.error('Error sending confirmation email:', confirmError);
            }
        });
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully! We will contact you soon.' 
        });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Node.js server ready to handle form submissions and API requests`);
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!' 
    });
});