pragma solidity ^0.4.17;

contract CarSale {
    // A car's make is the brand of the vehicle, while the model refers to the name of a car product
    // For example,Toyota is a car make and Camry is a car model.
    struct Car {
        string make;
        string model;
        string registrationNumber;
        uint manufactureDate;
        int mileage;
    }

    Car public car;
    address public vendor;
    address public purchaser;
    uint price;
    string comment;
    bool seenAndCheckedByPurchaser;
    bool finalized;

    function CarSale(uint _price, string memory carMake, string memory carModel, string memory carRegistrationNumber, uint carManufactureDate, int carMileage) public {
        car = Car({
        make : carMake,
        model : carModel,
        registrationNumber : carRegistrationNumber,
        manufactureDate : carManufactureDate,
        mileage : carMileage
        });
        vendor = msg.sender;
        price = _price;
    }

    modifier restricted() {
        require(msg.sender == vendor);
        _;
    }
    modifier notFinalized() {
        require(finalized == false);
        _;
    }

    function submitBuyProposal() public notFinalized payable{
        require(msg.value == price);
        purchaser = msg.sender;
        seenAndCheckedByPurchaser = true;
    }

    function sell() public restricted notFinalized{
        require(seenAndCheckedByPurchaser == true);
        vendor.transfer(address(this).balance);
        finalized = true;
    }

    function setComment(string memory _comment) public notFinalized{
        comment = _comment;
    }
}