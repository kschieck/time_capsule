var express = require('express');
var config = require('config');
var router = express.Router();
var connect = require("../lib/mongo-helper.js").connect_middleware;
const { ObjectId } = require('mongodb');
var crypto = require("crypto");
const { twig } = require("twig");
const fs = require("fs");
const { getDayStartTime, getCurrentTime } = require("../lib/time-helper.js");

const email_regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

router.get('/inspiration', function(req, res, next) {
  res.render('inspiration', {
    title: 'Time Capsule',
    message: "What Should I Write About?",
    text: `
<p>Write about what your life is like now, what you hope it will be like when you receive your message.</p>
<p>Write about what you think about, what you're stressing about and maybe in the future you'll see these things weren't as bad, or were even better than you thought.</p>
<p>Write about goals you hope to achieve by the time you receive your message, or a reminder to keep going.</p>
<p>Write about your daily life, your relationships.</p>
<p>Write about something nice you did, or that someone did for you. Remind yourself of something to appreciate.</p>
<p>Clear your mind and write about whatever comes into it.</p>
<p>Or write your deepest secrets, but you might want to <a href="https://www.devglan.com/online-tools/rsa-encryption-decryption">encrypt</a> them first.</p>
    `
  });
})

/* GET users listing. */
router.get('/:id', connect, async function(req, res, next) {
  var findResult = await req.db.collection.find({_id: req.params.id}).toArray();
  req.db.client.close();

  if (findResult.length > 0) {

    var note = findResult[0];
    if (note.hasOwnProperty("unlock_date") && note.unlock_date > getDayStartTime()) {
      var template = twig({
        data: fs.readFileSync('content/note-locked.twig', 'utf-8')
      });
      res.render('locked-note', {
        title: 'Time Capsule',
        message: "Your Time Capsule is Locked",
        text: template.render({ unlock_date: note.unlock_date.toDateString() })
      });
      return;
    }

    var template = twig({
      data: fs.readFileSync('content/note-unlocked.twig', 'utf-8')
    });

    res.status(200);
    res.render('note', { 
      title: 'Time Capsule', 
      message: "Your Time Capsule Message", 
      text: template.render({ text: note.text })
    });
    return;
  }

  next();
});

router.post('/', connect, async function(req, res, next) {
  if (!req.body) {
    res.status(400).send("No request body");
    return;
  }

  var text = req.body.text || "";
  var email = req.body.email || "";
  var duration = parseInt(req.body.duration);

  if (!email_regex.test(email)) {
    res.status(400).send("invalid email");
    return;
  }

  if (text == "") {
    res.status(400).send("message empty");
    return;
  }

  // Must match with client display
  var unlock_date = getDayStartTime();
  switch (duration) {
    case 1: // 1 month
      unlock_date = new Date(unlock_date.setMonth(unlock_date.getMonth()+1));
      break;
    case 2: // 6 months
      unlock_date = new Date(unlock_date.setMonth(unlock_date.getMonth()+6));
      break;
    case 3: // 1 year
      unlock_date = new Date(unlock_date.setYear(unlock_date.getFullYear()+1));
      break;
    case 4: // 2 years
      unlock_date = new Date(unlock_date.setYear(unlock_date.getFullYear()+2));
      break;
    case 5: // 5 years
      unlock_date = new Date(unlock_date.setYear(unlock_date.getFullYear()+5));
      break;
    default:
      res.status(400).send("invalid duration");
      return;
  }

  var id = crypto.randomBytes(20).toString('hex');
  var result = await req.db.collection.insertOne({
    _id: id,
    text, 
    email, 
    create_date: getCurrentTime(), 
    unlock_date, 
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress 
  })
    .then(() => {
      res.writeHead(302, {
        'Location': '/notes/' + id
      });
      res.end();
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  
});

module.exports = router;
