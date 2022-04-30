import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
export async function sendMail(to: string, html: string) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();
    console.log('testaccount ',testAccount);
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'gdq3nfql2p5nlunh@ethereal.email', 
            pass: 'zxHpS8t92tFVV8uSb7', 
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>', // sender address
        to, // list of receivers
        subject: "Change Password", // Subject line
        html
    });

    console.log("Message sent: %s", info.messageId);
    
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
