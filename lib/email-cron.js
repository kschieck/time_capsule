const connect = require("./mongo-helper.js").connect;
const nodemailer = require("nodemailer");
const util = require('util');
const config = require("config");
const fs = require("fs");
const { twig } = require("twig");

var transporter = nodemailer.createTransport({
  service: config.get("email_service"),
  auth: {
    user: config.get("email_user"),
    pass: config.get("email_password")
  }
});
const sendMail = util.promisify(transporter.sendMail);

const hostname = config.get("hostname");
const mailFrom = config.get("email_from");
const emailSubject = config.get("email_subject");

// setup cronjob for emails
var CronJob = require('cron').CronJob;
var job = new CronJob('*/5 * * * * *', async function() { // TODO every 5 mins
//var job = new CronJob('0 0 0 * * *', async function() { // TODO every day at 00:00:00
  var connection = await connect();

  // Matured but not sent, and not blocked query
  var query = { 
    send_date: { $lt: new Date() }, 
    sent_date : { $exists: false }, 
    blocked: { $exists: false } 
  };
  var findResult = await connection.collection.find(query);

  var template = twig({
    data: fs.readFileSync('./content/email_template.twig', 'utf-8')
  });

  while (await findResult.hasNext()) {
    var next = await findResult.next();

    var createDate = next.create_date.toDateString();
    var sendDate = next.send_date.toDateString();
    var link = `http://${hostname}/notes/${next._id}`;

    var mailOptions = {
      from: mailFrom,
      to: next.email,
      subject: emailSubject,
      html: template.render({
        create_date: createDate,
        send_date: sendDate,
        link:link
      }),
    };

    await sendMail(mailOptions)
      .then(info => {
        console.log(next._id, 'Email sent: ' + info.response);
      })
      .catch(error => console.log(next._id, error));

    await connection.collection.updateOne({_id: next._id}, {$set: {sent_date: new Date() }});
  }

  connection.client.close();
}, null, true, 'America/Los_Angeles');
job.start();
