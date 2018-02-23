var BlockList = artifacts.require('./BlockList.sol');

contract('BlockList', function(accounts) {
  let blockListInstance;
  const seller = accounts[1];
  const itemName = 'uber hot sauce';
  const itemDescription = 'the hottest hot sauce';
  const itemPrice = 17;

  beforeEach(function() {
    return BlockList.deployed().then((instance) => {
      blockListInstance = instance;
    });
  });

  it('should initialize with an empty state', function() {
    return blockListInstance.getItem().then((data) => {
      assert.equal(data[0], 0x0, 'seller is empty');
      assert.equal(data[1], '', 'name is empty');
      assert.equal(data[2], '', 'description is empty');
      assert.equal(data[3].toNumber(), 0, 'price is zero');
    });
  });

  it('should sell an item', function() {
    return blockListInstance.
      sellItem(itemName, itemDescription, web3.toWei(itemPrice, 'ether'), { from: seller }).
      then(blockListInstance.getItem).
      then((data) => {
        assert.equal(data[0], seller);
        assert.equal(data[1], itemName);
        assert.equal(data[2], itemDescription);
        assert.equal(data[3].toNumber(), web3.toWei(itemPrice, 'ether'));
      });
  });
});
