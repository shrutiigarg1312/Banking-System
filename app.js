const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const port = process.env.PORT || 3000;

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/bankDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});



/* --------------- User Schema -------------------------- */
const userSchema = mongoose.Schema({
  name: String,
  email: String,
  balance: Number,
  gender: String,
  address: String,
  contact: Number,
});
/* User Model*/
const User = mongoose.model("User", userSchema);



/*------------ Transaction-history Schema-------------------- */
const transactionSchema = mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  amount: Number,
  date: String,
});
/* Transaction-history model */
const Transaction = mongoose.model("Transaction", transactionSchema);



/*-------------------- Home page----------------------- */

/* Getting the home page */
app.get("/", (req, res) => {
  res.render("index");
});



/*----------------- Create user page-------------------- */

/* Getting the create user page */
app.get("/create-user", (req, res) => {
  res.render("create-user");
});

/* Function for create user button in create user page */
app.post("/create-user", (req, res) => {
  const userName = req.body.name;
  const userEmail = req.body.email;
  const userBalance = req.body.balance;
  const userGender = req.body.gender;
  const userAdd = req.body.address;
  const userContact = req.body.contact;

  const user = new User({
    name: userName,
    email: userEmail,
    balance: userBalance,
    gender: userGender,
    address: userAdd,
    contact: userContact,
  });
  user.save();
  res.redirect("/create-user");
});



/*--------------------- Transfer Money page-------------------- */

/* Getting transfer money page */
app.get("/transfer-money", (req, res) => {
  User.find({}, (err, foundUser) => {
    res.render("transfer-money", { users: foundUser });
  });
});

/* Function for transfer button present in  table */
app.post("/transferMoney", (req, res) => {
  const user = JSON.parse(req.body.currentuser);
  res.redirect("/transferMoney-get/" + user.name);
});



/*------------------- Transfer- money- form page ------------------- */

/*Getting the transfer-money-form page */
app.get("/transferMoney-get/:userName", (req, res) => {
  const userName = req.params.userName;
  User.findOne({ name: userName }, (err, foundUser) => {
    User.find({}, (err, foundUsers) => {
      res.render("transfer-form", {
        username: foundUser.name,
        userbalance: foundUser.balance,
        allusers: foundUsers,
      });
    });
  });
});

/* Function for transfer button in the form*/
app.post("/transaction", (req, res) => {
  const transferFrom = req.body.from;
  const transferTo = req.body.to;
  const transferAmt = parseInt(req.body.amount);

  /*Finding the sender from his/her name */
  User.findOne(
    {
      name: transferFrom,
    },
    function (err, sender) {
      updateSenderBalace(sender.balance - transferAmt);
    }
  );
  /* Function for updating the sender's balance */
  function updateSenderBalace(newBalance) {
    /*to obtain the current date and time */
    let today = new Date();
    let date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    let time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date + "  " + time;

    /*Rendering transaction data to our transaction table */
    const transaction = new Transaction({
      from: transferFrom,
      to: transferTo,
      amount: transferAmt,
      date: dateTime,
    });
    transaction.save();
    User.findOneAndUpdate(
      {
        name: transferFrom,
      },
      {
        $set: {
          balance: newBalance,
        },
      },
      {
        new: true,
      },
      function (err, sender) {}
    );
  }

  /*Finding the reciever from his/her name */
  User.findOne(
    {
      name: transferTo,
    },
    function (err, receiver) {
      updateReceiverBalance(receiver.balance + transferAmt);
    }
  );
  /* Function for updating the reciever's balance */
  function updateReceiverBalance(newBalance) {
    User.findOneAndUpdate(
      {
        name: transferTo,
      },
      {
        $set: {
          balance: newBalance,
        },
      },
      {
        new: true,
      },
      function (err, receiver) {}
    );
  }
  res.redirect("/transaction-history");
});



/*---------------- Transaction History page---------------- */

/*Getting the transaction-history page */
app.get("/transaction-history", (req, res) => {
  Transaction.find({}, (err, foundUser) => {
    res.render("transaction-history", { transactions: foundUser });
  });
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
