import axios from 'axios';

// Gửi email qua Brevo HTTP API (không dùng SMTP, tránh bị chặn cổng trên Railway)
// Tài liệu: https://developers.brevo.com/reference/sendtransacemail

const apiClient = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'api-key': process.env.BREVO_API_KEY,
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
});

const sendEmail = async ({ to, subject, body, attachments = [] }) => {
  try {
    const emailPayload = {
      sender: {
        email: process.env.SENDER_EMAIL,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: body,
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailPayload.attachment = attachments;
    }

    const response = await apiClient.post('/smtp/email', emailPayload);

    return response.data;
  } catch (error) {
    console.error('Error sending email via Brevo API:', error?.response?.data || error.message);
    throw error;
  }
};

export default sendEmail;