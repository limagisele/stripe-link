/**
 * Make call to server to get sorted leaderboard
  * @returns {Array} sellers - Returns Seller array with name, email, and total amount that is sorted desc by total amount
 */
export const getLeaders = async () => {
  // Milestone 2: Leaderboard
  try {
    const response = await fetch('http://localhost:4242/leaders')
    const data = await response.json()
    console.log(`getLeaders: ${data.sellers}`)
    return data.sellers
  } catch (error) {
    console.log(error)
  }
};