How to get more test tokens:
Since your TestUSDT smart contract already has an owner-controlled mint function built into it, you do not need to redeploy the contract to get more tokens. Your Treasury wallet (the owner/deployer of the contract) has permission to mint new tokens out of thin air.

I have created a new script mintCustom.js inside /blockchain/scripts/ to make minting easy.

To mint more tokens to your MetaMask wallet, run the following command in the /blockchain directory (set your MetaMask wallet address as TARGET_ADDRESS and the amount you want as AMOUNT):

TARGET_ADDRESS=0xYourMetaMaskAddressHere AMOUNT=5000000 npx hardhat run scripts/mintCustom.js --network amoy

Or:
TARGET_ADDRESS=[YOUR_METAMASK_ADDRESS] AMOUNT=[AMOUNT] npx hardhat run scripts/mintCustom.js --network amoy

e.g:

TARGET_ADDRESS=0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e AMOUNT=5000000 npx hardhat run scripts/mintCustom.js --network amoy


TARGET_ADDRESS=0x5d0d0e728e6656A279707262e403Ca2f2C2AA746 AMOUNT=5000000 npx hardhat run scripts/mintCustom.js --network amoy