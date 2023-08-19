import React, { useEffect, useState } from "react";
import SignupComplete from "./SignupComplete";

const RegistrationForm = () => {
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerDisplayName, setSellerDisplayName] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [existingSeller, setExistingSeller] = useState(null);
  const [hideInstruction, setHideInstruction] = useState(false);
  const handleClick = async () => {
    setError(null)
    if (sellerDisplayName === "" || sellerEmail === "") {
      setError("Email Address and Display Name are required")
    }
    else {
      setProcessing(true)
      setExistingSeller(null)
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ name: sellerDisplayName, email: sellerEmail })
      }
      const response = await fetch('http://localhost:4242/create-payment-link', requestOptions)
      const data = await response.json()
      if (data.error === 'Invalid email') {
        setError('Invalid email address entered')
        setSucceeded(false)
      } else if (data.url) {
        data.status === 201 ? setExistingSeller(false) : setExistingSeller(true)
        setPaymentLink(data.url)
        setSucceeded(true)
        setHideInstruction(true)
      }
      else {
        setError("Something went wrong!")
      }
    }
    setProcessing(false)
  };

  useEffect(() => {
  }, []);

  return (
    <div className={`seller-form`}>
      {!succeeded ? (
        <div className={`seller-desc`}>
          <div className="seller-grid">
            <div
              className={`home-body ${
                hideInstruction ? "hide-instructionText" : ""
              }`}
            >
              <p>Once the form is submitted, you will receive your own personal
              link to share. The top seller of the week will receive free
              tickets to the next Afrobeatles concert!</p>
            </div>
            <div className="seller-inputs">
              <div className="seller-input-box">
                <input
                  type="text"
                  id="email"
                  value={sellerEmail}
                  placeholder="Email Address"
                  onChange={(e) => setSellerEmail(e.target.value)}
                />
              </div>
              <div className="seller-input-box">
                <input
                  type="text"
                  id="username"
                  value={sellerDisplayName}
                  placeholder="Display Name"
                  className="pmlink-input"
                  onChange={(e) => setSellerDisplayName(e.target.value)}
                />
              </div>
              <div className="username-help-text">
                This is what will be displayed on the leaderboard
              </div>
              {existingSeller && (
                <div
                  className="paymentlink-error"
                  id="paymentlink-exists-error"
                >
                  A seller with that email address already exists.
                  {"\n"}
                  <span id="error_message_customer_email">{sellerEmail}</span>
                </div>
              )}
              {error && existingSeller === null && (
                <div className="paymentlink-error" id="paymentlink-errors">
                  <div className="paymentlink-error" id="paymentlink-error" role="alert">
                    {error}
                  </div>
                </div>
              )}
            </div>
            <div className="button-center">
              <button id="submit" 
                  className="button" 
                  disabled={processing}
                  onClick={handleClick}>
                Get Seller Link
              </button>
            </div>
          </div>
        </div>
      ) : (
        <SignupComplete
          active={succeeded}
          email={sellerEmail}
          name={sellerDisplayName}
          paymentLink={paymentLink}
        />
      )}
    </div>
  );
};
export default RegistrationForm;
