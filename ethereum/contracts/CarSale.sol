pragma solidity ^0.4.17;

contract CarSaleFactory {
    address[] public deployedCarSales;

    function createCarSale(string memory carMake, string memory carModel, string memory carRegistrationNumber,
        uint carManufactureYear, int carMileage) public {
        address newCarSale = new CarSale(carMake, carModel, carRegistrationNumber, carManufactureYear, carMileage, msg.sender);
        deployedCarSales.push(newCarSale);
    }

    function getDeployedCarSales() public view returns (address[]) {
        return deployedCarSales;
    }
}

contract CarSale {
    // A car's make is the brand of the vehicle, while the model refers to the name of a car product
    // For example,Toyota is a car make and Camry is a car model.
    struct Car {
        string make;
        string model;
        string registrationNumber;
        uint manufactureYear;
        int mileage;
        address owner;
    }

    Car public car;
    address public vendor;
    address public purchaser;
    uint price;
    string comment;
    bool sold;

    function CarSale(string memory carMake, string memory carModel, string memory carRegistrationNumber,
        uint carManufactureYear, int carMileage, address creator) public {
        car = Car({
            make : carMake,
            model : carModel,
            registrationNumber : carRegistrationNumber,
            manufactureYear : carManufactureYear,
            mileage : carMileage,
            owner: creator
        });
    }

    modifier restricted() {
        require(msg.sender == car.owner);
        _;
    }

    modifier purchasable() {
        require(price != 0);
        require(vendor != 0);
        require(sold == false);
        _;
    }

    function sell(uint _price, string _comment) public restricted{
        price = _price;
        comment = _comment;
        vendor = msg.sender;
    }

    function buy() public purchasable payable{
        require(msg.value == price);
        purchaser = msg.sender;
        sold = true;
        vendor.transfer(msg.value);
        car.owner = msg.sender;
    }

    function isSold() public view returns (bool){
        return sold;
    }

    function getCar() public view returns (string ,string ,string, uint, address, uint, bool){
        return (car.make, car.model, car.registrationNumber, car.manufactureYear, car.owner, price, sold);
    }

    function verifyOwner() public view returns(bool){
        return car.owner == msg.sender;
    }
}