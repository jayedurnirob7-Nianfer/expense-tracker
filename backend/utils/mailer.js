const nodemailer = require('nodemailer');

const sendRecoveryEmail = async (toEmail, otpCode, masterName = 'Master Nirob') => {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);

  const htmlContent = `
    <div style="background-color: #050b14; color: #e2e8f0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #06b6d4;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; padding: 8px 16px; background: rgba(6, 182, 212, 0.1); border: 1px solid #06b6d4; border-radius: 20px; font-size: 11px; font-weight: bold; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase;">
          J.A.R.V.I.S. SECURITY PROTOCOL
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
          Emergency Master Key Authorization
        </h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          Greetings, <strong>${masterName}</strong>. An emergency recovery request was initiated for your Expense Ledger.
        </p>
      </div>

      <div style="background: #09121d; border: 1px dashed #34d399; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;">
        <p style="color: #34d399; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px 0;">
          Your 6-Digit Master Recovery Code
        </p>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; background: #040810; padding: 12px 24px; border-radius: 8px; display: inline-block; border: 1px solid #1e293b;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 11px; margin: 12px 0 0 0;">
          Valid for 10 minutes • Single-use authorization key
        </p>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
        If you did not request this authorization, your ledger remains secure. Please verify your system logs immediately.
      </p>

      <div style="border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 11px; color: #475569;">
        NIROB INDUSTRIES OS v4.2 • QUANTUM SECURITY DIVISION
      </div>
    </div>
  `;

  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"J.A.R.V.I.S. Core" <${user}>`,
        to: toEmail,
        subject: `[J.A.R.V.I.S.] Emergency Master Recovery Code: ${otpCode}`,
        html: htmlContent,
      });

      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error('SMTP Mail error:', err.message);
      // Fallback in case of invalid SMTP
      console.log(`\n========================================\n[J.A.R.V.I.S. EMERGENCY RECOVERY CODE]\nRecipient: ${toEmail}\nCode: ${otpCode}\n========================================\n`);
      return { success: true, mode: 'terminal', warning: 'SMTP delivery failed. Code printed to terminal.' };
    }
  } else {
    // Development fallback
    console.log(`\n========================================\n[J.A.R.V.I.S. EMERGENCY RECOVERY CODE]\nRecipient: ${toEmail}\nCode: ${otpCode}\n========================================\n`);
    return { success: true, mode: 'terminal' };
  }
};

module.exports = { sendRecoveryEmail };
