pragma solidity ^0.4.26;

contract CarSaleFactory {
    address[] public deployedCarSales;

    function createCarSale(string memory carMake, string memory carModel, string memory carRegistrationNumber,
        uint carManufactureYear) public {
        address newCarSale = new CarSale(carMake, carModel, carRegistrationNumber, carManufactureYear, msg.sender);
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
    uint public price;
    string public comment;
    bool public isPutUpForSale;
    address[] public previousOwners;

    constructor(string memory carMake, string memory carModel, string memory carRegistrationNumber,
        uint carManufactureYear, address creator) public {
        car = Car({
            make : carMake,
            model : carModel,
            registrationNumber : carRegistrationNumber,
            manufactureYear : carManufactureYear,
            mileage : 0,
            owner: creator
        });
    }

    modifier shouldBeOwner() {
        require(msg.sender == car.owner, "msg.sender should be car owner");
        _;
    }

    modifier purchasable() {
        require(price != 0, "price should be set");
        require(vendor != 0, "vendor should be set");
        require(isPutUpForSale == true, "car should be put up for sale");
        _;
    }

    function putUpForSale(int carMileage, uint _price, string _comment) public shouldBeOwner{
        require(carMileage >= car.mileage, "car mileage should be Ascending");
        car.mileage = carMileage;
        price = _price;
        comment = _comment;
        vendor = msg.sender;
        isPutUpForSale = true;
    }

    function buy() public purchasable payable{
        require(msg.value == price);
        require(msg.sender != car.owner);
        purchaser = msg.sender;
        isPutUpForSale = false;
        vendor.transfer(msg.value);
        car.owner = msg.sender;
        previousOwners.push(vendor);
    }

    function verifyOwner() public view returns(bool){
        return car.owner == msg.sender;
    }

    function getPreviousOwners() public view returns (address[]) {
        return previousOwners;
    }
}