// batch-send.js
require('dotenv').config();
const { ethers } = require("ethers");

const RPC = process.env.RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY; // 强烈建议用 env，不要把私钥放代码里
const provider = new ethers.providers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const ERC20_ABI = [
  "function transfer(address to, uint amount) public returns (bool)",
  "function decimals() view returns (uint8)"
];

async function sendEthBatch(recipients, amounts, gasPriceGwei = null) {
  let nonce = await provider.getTransactionCount(wallet.address, "latest");
  for (let i = 0; i < recipients.length; i++) {
    const tx = {
      to: recipients[i],
      value: ethers.BigNumber.from(amounts[i]), // amounts already in wei
      nonce: nonce++,
      gasLimit: 21000
    };
    if (gasPriceGwei) tx.gasPrice = ethers.utils.parseUnits(gasPriceGwei.toString(), "gwei");
    const signed = await wallet.signTransaction(tx);
    const sent = await provider.sendTransaction(signed);
    console.log(`ETH tx sent: ${sent.hash}`);
    await sent.wait(1);
  }
}

async function sendErc20Batch(tokenAddress, recipients, amounts) {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  // 可选：查看 decimals
  // const d = await contract.decimals();
  let nonce = await provider.getTransactionCount(wallet.address, "latest");
  for (let i = 0; i < recipients.length; i++) {
    const tx = await contract.populateTransaction.transfer(recipients[i], amounts[i]);
    tx.nonce = nonce++;
    tx.gasLimit = 100000; // 视代币实现调整
    const signed = await wallet.signTransaction(tx);
    const sent = await provider.sendTransaction(signed);
    console.log(`ERC20 tx sent: ${sent.hash}`);
    await sent.wait(1);
  }
}

(async () => {
  // 示例：把下面替换为实际数据
  const ethRecipients = ["0xabc...", "0xdef..."];
  const ethAmountsWei = [
    ethers.utils.parseEther("0.01").toString(),
    ethers.utils.parseEther("0.02").toString()
  ];

  // await sendEthBatch(ethRecipients, ethAmountsWei, 30);

  // ERC20 示例（替换 token 地址和精度后的数值）
  const token = "0xYourTokenAddress";
  const ercRecipients = ["0xabc...", "0xdef..."];
  // amounts 为 token 的最小单位（例如 18 decimals 下 1 token = 1e18）
  const ercAmounts = [
    ethers.utils.parseUnits("100.0", 18).toString(),
    ethers.utils.parseUnits("50.0", 18).toString()
  ];
  // await sendErc20Batch(token, ercRecipients, ercAmounts);
})();
