require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: +process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) console.error("email config error:", error);
  else console.log("Email server is ready!");
});

const sendResetPassword = async (email, resetToken) => {
  const mailOptions = {
    from: '"Auth-Flow" <ezehemmanuel62@gmail.com>',
    to: email,
    subject: "Password Reset",
    html: `
    <h2>Hi dear,</h2>
    <p>your reset link <a href='http://127.0.0.1:5500/client/reset-password.html?token=${resetToken}'>link</a></p>
    <p>http://127.0.0.1:5500/client/reset-password.html?token=${resetToken}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};


module.exports = {sendResetPassword}