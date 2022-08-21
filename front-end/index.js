import { abi, contractAddress } from "./constants.js";
import { ethers } from "./ethers-5.2.esm.min.js";

const connectButton = document.querySelector("#connect");
const fundButton = document.querySelector("#fund");
const balanceButton = document.querySelector("#get-balance");
const withdrawButton = document.querySelector("#withdraw");
const input = document.querySelector("#eth-amount");

async function connect() {
  if (!window.ethereum) {
    alert("no metamask");
    return;
  }

  try {
    await ethereum.request({
      method: "eth_requestAccounts",
    });

    connectButton.innerHTML = "Connected";
  } catch (error) {
    console.error(error);
  }
}

async function getBalance() {
  if (!window.ethereum) {
    alert("no metamask");
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const balance = await provider.getBalance(contractAddress);
  console.log(ethers.utils.formatEther(balance));
}

async function fund() {
  if (!window.ethereum) {
    alert("no metamask");
    return;
  }

  const ethAmount = input.value;
  console.log(`Funding with ${ethAmount}...`);
  // provider / connection to the blockchain
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  // signer / wallet / someone with some gas - the account that we connected to our front-end
  const signer = provider.getSigner();
  // contract that we are interacting with => ABI & Address
  const contract = new ethers.Contract(contractAddress, abi, signer);
  try {
    const transactionResponse = await contract.fund({
      value: ethers.utils.parseEther(ethAmount),
    });
    await listenForTransactionMine(transactionResponse, provider);
    console.log("done");
  } catch (error) {
    console.error(error);
  }
}

async function withdraw() {
  if (!window.ethereum) {
    alert("no metamask");
    return;
  }

  // provider / connection to the blockchain
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  // signer / wallet / someone with some gas - the account that we connected to our front-end
  const signer = provider.getSigner();
  // contract that we are interacting with => ABI & Address
  const contract = new ethers.Contract(contractAddress, abi, signer);
  try {
    const transactionResponse = await contract.withdraw();
    await listenForTransactionMine(transactionResponse, provider);
    console.log("done");
  } catch (error) {
    console.error(error);
  }
}

function listenForTransactionMine(transactionResponse, provider) {
  return new Promise((res, rej) => {
    // listen for the transaction to finish
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      res(transactionReceipt.confirmations);
    });
  });
}

(function() {
  connectButton.addEventListener("click", connect);
  fundButton.addEventListener("click", fund);
  balanceButton.addEventListener("click", getBalance);
  withdrawButton.addEventListener("click", withdraw);
})();
