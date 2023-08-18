import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import LeaderboardRow from "../components/LeaderboardRow";
import { getLeaders } from "../Services/leaderboard";

const Leaderboard = () => {
  const [sellers, setSellers] = useState([]); //info about available sellers
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
  // TODO: Integrate Stripe
  }, []);

  return (
    <main className="main-global">
      <Header subheader={"Top Fans"} />
      {processing ? (
        <div className="spinner" id="spinner"></div>
      ) : (
        <div id="top-seller-summary" className="top-seller-summary">
        <div className="summary-content">
          <div id="summary-table" className="summary-table">
            <div className="summary-header-row">
              <div id="header-row" className="summary-header-name">
                Fan
              </div>
              <div className="summary-header-sale">Sales</div>
            </div>

            {sellers.map((seller) => (
              <LeaderboardRow key={seller.email}
                name={seller.name}
                amount={seller.amount}
                />
            ))}
          </div>
        </div>
      </div>
      )}
      
    </main>
  );
};

export default Leaderboard;
