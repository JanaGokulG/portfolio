export default async function handler(req, res) {
  // Enforce CORS and only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Please provide name, email, subject, and message.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.TO_EMAIL || 'janagokul2007@gmail.com';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not defined in environment variables.');
      return res.status(500).json({ error: 'Server configuration error. API key is missing.' });
    }

    // Call Resend's REST API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: [toEmail],
        subject: `[Portfolio Contact] ${subject}`,
        reply_to: `${name} <${email}>`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 8px;">
            <h2 style="color: #5cf8fc; background: #0f172a; padding: 15px; margin: -20px -20px 20px -20px; border-top-left-radius: 8px; border-top-right-radius: 8px; font-family: monospace;">
              New Portfolio Message
            </h2>
            <p><strong>Sender Name:</strong> ${name}</p>
            <p><strong>Sender Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #5cf8fc; border-radius: 4px; margin-top: 15px;">
              <strong>Message:</strong><br/>
              <p style="white-space: pre-wrap; margin-top: 5px;">${message}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #64748b; text-align: center;">
              Sent via your portfolio contact form. Reply directly to this email to contact the sender.
            </p>
          </div>
        `
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API response error:', result);
      return res.status(response.status).json({ error: result.message || 'Failed to send email.' });
    }

    return res.status(200).json({ success: true, message: 'Message sent successfully!', id: result.id });
  } catch (error) {
    console.error('Error handling contact form submission:', error);
    return res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
  }
}
