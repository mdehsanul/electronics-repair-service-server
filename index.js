const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ObjectID = require("mongodb").ObjectID;
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// mongodb
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7ajpn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client
    .db("electronic-repair-service")
    .collection("service");
  const orderCollection = client
    .db("electronic-repair-service")
    .collection("orders");
  const adminCollection = client
    .db("electronic-repair-service")
    .collection("admin");
  const reviewCollection = client
    .db("electronic-repair-service")
    .collection("review");

  // create
  app.post("/addService", (req, res) => {
    const newService = req.body;
    collection.insertOne(newService).then((result) => {
      console.log("inserted count: ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  // Read
  app.get("/serviceDetail", (req, res) => {
    collection.find().toArray((err, documents) => {
      res.send(documents);
    });
  });

  // Delete
  app.delete("/delete/:id", (req, res) => {
    collection.deleteOne({ _id: ObjectID(req.params.id) }).then((result) => {
      res.send(result.deletedCount > 0);
    });
  });

  // Create Service Order
  app.post("/addOrder", (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // Read single service using id
  app.get("/book/:id", (req, res) => {
    collection
      .find({ _id: ObjectID(req.params.id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });

  // Read specific user service order
  app.get("/orderDetail", (req, res) => {
    const email = req.query.email;
    orderCollection.find({ userEmail: email }).toArray((err, documents) => {
      res.send(documents);
    });
  });

  // Read all user detail
  app.get("/allServiceOrder", (req, res) => {
    orderCollection.find().toArray((err, documents) => {
      res.send(documents);
    });
  });

  // Create Admin email to database
  app.post("/addAdmin", (req, res) => {
    const newAdmin = req.body;
    adminCollection.insertOne(newAdmin).then((result) => {
      console.log("inserted count: ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  // loggedIn user Admin or not
  app.post("/isAdmin", (req, res) => {
    const email = req.body.adminEmail;
    adminCollection.find({ adminEmail: email }).toArray((err, admin) => {
      res.send(admin.length > 0);
    });
  });

  // Create Review to database
  app.post("/addReview", (req, res) => {
    const newReview = req.body;
    reviewCollection.insertOne(newReview).then((result) => {
      console.log("inserted count: ", result.insertedCount);
      res.send(result.insertedCount > 0);
    });
  });

  // Read ReviewInfo to database
  app.get("/reviewFromCustomer", (req, res) => {
    reviewCollection.find().toArray((err, documents) => {
      res.send(documents);
    });
  });

  // Update Status Change
  app.patch("/updateOrderStatus/:id", (req, res) => {
    console.log(req.body.status);
    console.log(ObjectID(req.params.id));
    orderCollection
      .updateOne(
        { _id: ObjectID(req.params.id) },
        { $set: { status: req.body.status } }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
        // console.log(result);
      });
  });

  // Payment
  app.post("/payment", cors(), async (req, res) => {
    let { amount, id } = req.body;
    try {
      const payment = await stripe.paymentIntents.create({
        amount,
        currency: "USD",
        description: "Electronics Repair Service",
        payment_method: id,
        confirm: true,
      });
      console.log("Payment", payment);
      res.json({
        message: "Payment Successful",
        success: true,
      });
    } catch (error) {
      console.log("Error", error);
      res.json({
        message: "Payment Failed",
        success: false,
      });
    }
  });
});

const port = 4000;
app.listen(process.env.PORT || port);
