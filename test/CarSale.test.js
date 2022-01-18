const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const compiledCarSale = require("../ethereum/build/CarSale.json");

let carSale;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    carSale = await new web3.eth.Contract(JSON.parse(compiledCarSale.interface))
        .deploy({ data: compiledCarSale.bytecode })
        .send({ from: accounts[0], gas: "1000000" });
});

describe("CarSale", () => {
    it("deploys a carSale", () => {
        assert.ok(carSale.options.address);
    });
});
