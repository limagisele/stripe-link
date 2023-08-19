/* eslint-disable no-console */

// Replace if using a different env file or config
const { resolve } = require("path");
const envpath = resolve("./.env");
const fs = require("fs");
if (!fs.existsSync(envpath)) {
  console.log("Please make sure valid .env file exist in code/server directory.");
  process.exit(100);
}

require("dotenv").config({ path: "./.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const express = require("express");


const Product = require("./services/product");
const Seller = require("./services/seller");

const app = express();

const cors = require("cors");

const allitems = {};

app.use(express.static(process.env.STATIC_DIR));

app.use(express.json());

app.use(cors({ origin: true }));

// Provision
const provision = require("./services/provision");
const cache = require('./services/cache');

// Routes
app.get("/", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/index.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.get("/leaderboard", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/leaderboard.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.get("/signup", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/signup.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

/**
 * Get the Price Id of the Product
 * @returns Price Id of the Product that was setup for challenge
 */
const getPriceIdFromCache = async () => {
  // TODO: Integrate Stripe
};

/**
 * Validate Email address is valid String format. 
 * Use this function to ensure that only one payment link is created per email.
 * @param {string} inputEmail  
 * @returns {boolean}
 */
const validateEmail = async (inputEmail) => {
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (inputEmail.match(mailformat)) {
    return true;
  } else {
    return false;
  } 
};



/**
 * Milestone 1: Creating Payment Links
 * Validate the Email Address is valid String format.
 * After email address validation, create a new Payment Link for the fan, if one does not exists.
 */
app.post("/create-payment-link", async (req, res) => {
  const inputEmail = req.body.email
  const inputName = req.body.name
  let customer
  let paymentLink

  if (await validateEmail(inputEmail)) {
    const customerResponse = await stripe.customers.search({ query: `name:\'${inputName}\'`})
    if (customerResponse?.data?.length > 0) {
      customer = customerResponse.data[0]
      paymentLink = customer.metadata.payment_link_url
      res.send({ status: 200, url: paymentLink })
    }
    else {
      const product = cache.get('product')
      console.log(cache.get('product'))
      if (product?.price) {
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [{ price: product.price?.id, quantity: 1 }],
          metadata: { fan_name: inputName, fan_email: inputEmail },
        })
        customer = await stripe.customers.create({ name: inputName, email: inputEmail, metadata: { payment_link_url: paymentLink.url } })
        res.send({ status: 201, url: paymentLink.url })
      }
      else {
        res.send({ status: 500, error: "network error" })
      }
    }
  }
  else {
    res.send({status: 400, error: 'Invalid email'})
  }
});

/**
 * Milestone 2: Leaderboard
 * Get the Leaderboard data leveraging manual pagination of the Checkout sessions to total amount by fan email address
 * Returns Seller array with name, email, and total amount that is sorted desc by total amount
 */
app.get("/leaders", async (req, res) => {
  // TODO: Integrate Stripe
});



function errorHandler(err, req, res, next) {
  res.status(500).send({ error: { message: err.message } });
}

app.use(errorHandler);

app.listen(4242, async () => {
  // On server startup, create product and plan and store in-memory
  await provision();
  console.log("Node server listening on port http://localhost:4242");
});
