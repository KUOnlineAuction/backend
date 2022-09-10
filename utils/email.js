const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid')

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.displayName;
    this.url = url;
    this.from = `Name <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      // return nodemailer.createTransport({
      //   servide: "SendGrid",
      //   auth: {
      //     user: process.env.SENDGRID_USERNAME,
      //     pass: process.env.SENDGRID_PASSWORD
      //   },
      //   tls: {rejectUnauthorized: false}
      // });
      return nodemailer.createTransport(
        nodemailerSendgrid({
          apiKey: process.env.SENDGRID_PASSWORD
        })
      )
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(subject, text) {
    // 1) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: text
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendConfirmEmail() {
    const subject = 'Confirm your account'
    const text = `Hello, thank you for singing up an account for OnlineAuction.com. To continue with your
            registration, please navigate to the URL below to confirm your account validity \n
            ${this.url} \n`
    await this.send(subject, text);
  }

  async sendPasswordReset() {
    const subject = 'Password reset'
    const text = `Please navigate to the URL below to reset your password.\n
            ${this.url} \n`
    await this.send(subject, text);
  }
};
