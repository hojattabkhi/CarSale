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
        .deploy({data: compiledFactory.bytecode})
        .send({from: accounts[0], gas: "2000000"});

    await factory.methods.createCarSale("Toyota", "Yaris", "AB-CDE-12345", 2012).send({
        from: accounts[0],
        gas: "2000000",
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

    it("owner can put the car up for sale", async () => {
        const _comment = "sell as seen";
        const _price = 90000000;
        const _mileage = 13000;
        await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});

        const price = await carSale.methods.price().call();
        const comment = await carSale.methods.comment().call();
        const car = await carSale.methods.car().call();

        assert.equal(_price, price);
        assert.equal(_comment, comment);
        assert.equal(_mileage, car.mileage);
    });

    it("non owner can not put the car up for sale", async () => {
        try {
            const _comment = "sell as seen";
            const _price = 90000000;
            const _mileage = 13000;
            await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[1], gas: "2000000"});
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it("car purchaser should differ from car vendor", async () => {
        try {
            const _comment = "sell as seen";
            const _price = 90000000;
            const _mileage = 13000;
            await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});
            await carSale.methods.buy().send({from: accounts[0], gas: "2000000", value: _price});
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it("can not buy car that was not put up for sale", async () => {
        try {
            await carSale.methods.buy().send({from: accounts[1], gas: "2000000", value: 1000});
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it("can sale a car and price should be transfer from purchaser to vendor", async () => {
        const _comment = "sell as seen";
        const _price = "1000000000000000000";
        const _mileage = 13000;
        await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});
        let purchaserBalance = await web3.eth.getBalance(accounts[1]);
        purchaserBalance = web3.utils.fromWei(purchaserBalance, "ether");
        let vendorBalance = await web3.eth.getBalance(accounts[0]);
        vendorBalance = web3.utils.fromWei(vendorBalance, "ether");
        await carSale.methods.buy().send({from: accounts[1], gas: "2000000", value: _price});
        let purchaserNewBalance = await web3.eth.getBalance(accounts[1]);
        purchaserNewBalance = web3.utils.fromWei(purchaserNewBalance, "ether");
        let vendorNewBalance = await web3.eth.getBalance(accounts[0]);
        vendorNewBalance = web3.utils.fromWei(vendorNewBalance, "ether");

        const priceInEther = web3.utils.fromWei(_price, "ether");
        assert(purchaserBalance - purchaserNewBalance > priceInEther);
        assert.equal(vendorNewBalance - vendorBalance, priceInEther);
    });

    it("car owner should set correctly during the sale", async () => {
        const _comment = "sell as seen";
        const _price = 3;
        const _mileage = 13000;
        await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});

        let ownedByOwner = await carSale.methods.verifyOwner().call({from: accounts[0]});
        assert.equal(ownedByOwner, true);

        await carSale.methods.buy().send({from: accounts[1], gas: "2000000", value: _price});
        const previousOwners = await carSale.methods.getPreviousOwners().call({from: accounts[1]});
        assert.equal(previousOwners[0], accounts[0])
        let ownedByVendor = await carSale.methods.verifyOwner().call({from: accounts[0]});
        let ownedByPurchaser = await carSale.methods.verifyOwner().call({from: accounts[1]});
        assert.equal(ownedByVendor, false);
        assert.equal(ownedByPurchaser, true);
    });

    it("can not buy the car that was purchased before", async () => {
        try {
            await carSale.methods.buy().send({from: accounts[1], gas: "2000000", value: 1000});
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it("car mileage should be ascending when put it up for sale", async () => {
        try {
            const _comment = "sell as seen";
            const _price = 3;
            const _mileage = 13000;
            await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});
            await carSale.methods.buy().send({from: accounts[1], gas: "2000000", value: _price});
            await carSale.methods.putUpForSale(_mileage - 1000, _price, _comment).send({
                from: accounts[1],
                gas: "2000000"
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });

    it("owner can update comment, price and mileage until sale", async () => {
        let _comment = "sell as seen";
        let _price = 3;
        let _mileage = 13000;
        await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});
        _comment = "I decrease the price because of purchaser bargain:)";
        _price = 2;
        _mileage = 14000;
        await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});

        const price = await carSale.methods.price().call();
        const comment = await carSale.methods.comment().call();
        const car = await carSale.methods.car().call();
        assert.equal(_price, price);
        assert.equal(_comment, comment);
        assert.equal(_mileage, car.mileage);
    });

    it("can sale purchased car by new owner", async () => {
        let _comment = "sell as seen";
        let _price = 3;
        let _mileage = 13000;
        await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[0], gas: "2000000"});
        await carSale.methods.buy().send({from: accounts[1], gas: "2000000", value: _price});

        let ownedByVendor = await carSale.methods.verifyOwner().call({from: accounts[0]});
        let ownedByPurchaser = await carSale.methods.verifyOwner().call({from: accounts[1]});
        assert.equal(ownedByVendor, false);
        assert.equal(ownedByPurchaser, true);

        _comment = "it has worked more so i decide to sale less:)"
        _mileage = 15000;
        _price = 2;
        await carSale.methods.putUpForSale(_mileage, _price, _comment).send({from: accounts[1], gas: "2000000"});

        await carSale.methods.buy().send({from: accounts[2], gas: "2000000", value: _price});

        ownedByVendor = await carSale.methods.verifyOwner().call({from: accounts[1]});
        ownedByPurchaser = await carSale.methods.verifyOwner().call({from: accounts[2]});
        assert.equal(ownedByVendor, false);
        assert.equal(ownedByPurchaser, true);
    });
});
