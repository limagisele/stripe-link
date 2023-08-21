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
  await provision()
  const product = await cache.get('product')
  console.log(`product in memory: ${product?.price?.id}`)
  return product?.price?.id
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
  let customer = null
  let paymentLink = null

  if (await validateEmail(inputEmail)) {
    const customerResponse = await stripe.customers.search({ query: `name:\'${inputName}\'`})
    if (customerResponse?.data?.length > 0) {
      customer = customerResponse.data[0]
      paymentLink = customer.metadata.payment_link_url
      res.send({ status: 200, url: paymentLink })
    }
    else {
      const priceId = await getPriceIdFromCache()
      if (priceId) {
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: { fan_name: inputName, fan_email: inputEmail },
        })
        customer = await stripe.customers.create({
          name: inputName,
          email: inputEmail,
          metadata: { payment_link_url: paymentLink.url },
        })
        res.send({ status: 201, url: paymentLink.url })
      } else {
        res.send({ status: 500, error: 'network error' })
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
const getSessions = async () => {
  const sessionsList = []
  let sessions = { has_more: true }
  while (sessions.has_more && sessionsList.length < 500) {
    let lastElement = sessionsList.length
      ? sessionsList[sessionsList.length - 1].id
      : null
    let sessionsOptions = lastElement
      ? { limit: 100, starting_after: lastElement }
      : { limit: 100 }
    sessions = await stripe.checkout.sessions.list({ ...sessionsOptions })
    if (sessions?.data?.length > 0) {
      let sessionsResponse = sessions.data.filter(
        (session) =>
          'fan_email' in session.metadata && 'fan_name' in session.metadata
      )
      sessionsList.push(...sessionsResponse)
    }
  }
  return sessionsList
}

const getSellersSummary = async (sessionsList) => {
  const sellers = sessionsList.reduce((list, session) => {
    const listIndex = list.findIndex(
      (obj) => obj.email === session.metadata.fan_email
    )
    if (listIndex !== -1) {
      list[listIndex].amount =
        list[listIndex].amount + session.amount_total
    } else {
      list.push({
        name: session.metadata.fan_name,
        email: session.metadata.fan_email,
        amount: session.amount_total,
      })
    }
    return list
  }, [])
  return sellers
}

const sortSellers = async (sellersSummary) => {
  return sellersSummary.sort((a, b) => b.amount - a.amount)
}

app.get("/leaders", async (req, res) => {
  try {
    const sessionsList = await getSessions()
    console.log(`sessionsList: ${sessionsList}`)
    const sellersSummary = await getSellersSummary(sessionsList)
    console.log(`SellersSummary: ${sellersSummary}`)
    const sortedSellers = await sortSellers(sellersSummary)
    console.log(`sortedSellers: ${sortedSellers}`)
    res.send({status: 200, sellers: sortedSellers})
  } catch (error) {
    console.log(error)
    res.sendStatus(500)
  }
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
