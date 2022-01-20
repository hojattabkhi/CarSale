const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const compiledFactory = require("../ethereum/build/CarSaleFactory.json");
const compiledCarSale = require("../ethereum/build/CarSale.json");

let accounts;
let factory;
let carSaleAddress;
let carSale;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({ data: compiledFactory.bytecode })
        .send({ from: accounts[0], gas: "1000000" });

    await factory.methods.createCarSale("Toyota", "Yaris", "AB-CDE-12345", 2012, 156000).send({
        from: accounts[0],
        gas: "1000000",
    });
    [carSaleAddress] = await factory.methods.getDeployedCarSales().call();
    carSale = await new web3.eth.Contract(
        JSON.parse(compiledCarSale.interface),
        carSaleAddress
    );
});

describe("CarSale", () => {
    it("deploys a carSale", () => {
        assert.ok(factory.options.address);
        assert.ok(carSale.options.address);
    });

    it("marks caller as the car owner", async () => {
        const car = await carSale.methods.car().call();
        assert.equal(accounts[0], car.owner);
    });
});
