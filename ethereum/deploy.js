const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const compiledCarSale = require('./build/CarSale.json');

const provider = new HDWalletProvider(
    'pistol total physical bleak bar gossip hope nephew horror render focus face',
    'https://rinkeby.infura.io/v3/663542e7257d48ed917fbaf40a46f00b'
);
const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account', accounts[0]);

    const result = await new web3.eth.Contract(
        JSON.parse(compiledCarSale.interface)
    )
        .deploy({ data: compiledCarSale.bytecode })
        .send({ gas: '1000000', from: accounts[0] });

    console.log('Contract deployed to', result.options.address);
    provider.engine.stop();
};
deploy();
