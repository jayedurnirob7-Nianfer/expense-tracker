const nodemailer = require('nodemailer');

const sendRecoveryEmail = async (toEmail, otpCode, userName = 'Nirob') => {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);

  if (!user || !pass) {
    console.error('SMTP Email Error: GMAIL_USER and GMAIL_APP_PASS must be configured in backend/.env');
    return { 
      success: false, 
      error: 'Email delivery is not configured. Please add your GMAIL_USER and GMAIL_APP_PASS in backend/.env.' 
    };
  }

  const htmlContent = `
    <div style="background-color: #050b14; color: #e2e8f0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #10b981;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; padding: 8px 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 20px; font-size: 11px; font-weight: bold; color: #34d399; letter-spacing: 2px; text-transform: uppercase;">
          SECURITY VERIFICATION
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
          Master Password Recovery
        </h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          A password reset request was initiated for your Expense Ledger.
        </p>
      </div>

      <div style="background: #09121d; border: 1px dashed #34d399; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
        <p style="color: #34d399; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px 0;">
          Your 6-Digit Recovery Code
        </p>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; background: #040810; padding: 12px 24px; border-radius: 8px; display: inline-block; border: 1px solid #1e293b;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 11px; margin: 12px 0 0 0;">
          Valid for 10 minutes • Single-use authorization key
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
        If you did not request this authorization, your ledger remains secure. You can safely ignore this email.
      </p>

      <div style="border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 11px; color: #475569;">
        Nirob Expense Ledger • Security System
      </div>
    </div>
  `;

  try {
    const transportOptions = host.includes('gmail')
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        };

    const transporter = nodemailer.createTransport(transportOptions);

    await transporter.sendMail({
      from: `"Ledger Security" <${user}>`,
      to: toEmail,
      subject: `Expense Ledger - Password Recovery Code: ${otpCode}`,
      html: htmlContent,
    });

    console.log(`[REAL EMAIL DISPATCHED] Recipient: ${toEmail}`);
    return { success: true, mode: 'smtp' };
  } catch (err) {
    console.error('SMTP Mail error:', err.message);
    return { success: false, error: `Email dispatch failed: ${err.message}` };
  }
};

module.exports = { sendRecoveryEmail };
