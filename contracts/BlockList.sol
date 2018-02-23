pragma solidity ^0.4.18;

// A simple contract for listing an item to sell or fetching the details
// of an existing item.
contract BlockList {
  address seller;
  string name;
  string description;
  uint256 price;

  function sellItem(string _name, string _description, uint256 _price) public {
    seller = msg.sender;
    name = _name;
    description = _description;
    price = _price;
  }

  function getItem() public view returns (
    address _seller,
    string _name,
    string _description,
    uint256 _price
  ) {
    return (seller, name, description, price);
  }
}
