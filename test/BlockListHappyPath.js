var BlockList = artifacts.require('./BlockList.sol');

contract('BlockList', function(accounts) {
  let blockListInstance;
  const seller = accounts[1];
  const buyer = accounts[2];
  const itemName = 'uber hot sauce';
  const itemDescription = 'the hottest hot sauce';
  const itemPrice = 17;
  let sellerBalanceBefore, sellerBalanceAfter;
  let buyerBalanceBefore, buyerBalanceAfter;

  beforeEach(function() {
    return BlockList.deployed().then((instance) => {
      blockListInstance = instance;
    });
  });

  it('should initialize with an empty state', function() {
    return blockListInstance.getItem().then((data) => {
      assert.equal(data[0], 0x0, 'seller is empty');
      assert.equal(data[1], 0x0, 'buyer is empty');
      assert.equal(data[2], '', 'name is empty');
      assert.equal(data[3], '', 'description is empty');
      assert.equal(data[4].toNumber(), 0, 'price is zero');
    });
  });

  it('should sell an item', () => {
    return blockListInstance.
      sellItem(itemName, itemDescription, web3.toWei(itemPrice, 'ether'), { from: seller }).
      then(blockListInstance.getItem).
      then((data) => {
        assert.equal(data[0], seller);
        assert.equal(data[1], 0x0);
        assert.equal(data[2], itemName);
        assert.equal(data[3], itemDescription);
        assert.equal(data[4].toNumber(), web3.toWei(itemPrice, 'ether'));
      });
  });

  it('should buy an item', () => {
    sellerBalanceBefore = web3.fromWei(web3.eth.getBalance(seller), 'ether').toNumber();
    buyerBalanceBefore = web3.fromWei(web3.eth.getBalance(buyer), 'ether').toNumber();

    return blockListInstance.buyItem({
      from: buyer,
      value: web3.toWei(itemPrice, 'ether')
    }).then((receipt) => {
      assert.equal(receipt.logs.length, 1);
      assert.equal(receipt.logs[0].event, "LogBuyItem");
      assert.equal(receipt.logs[0].args._seller, seller);
      assert.equal(receipt.logs[0].args._buyer, buyer);
      assert.equal(receipt.logs[0].args._name, itemName);
      assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(itemPrice, "ether"));

      sellerBalanceAfter = web3.fromWei(web3.eth.getBalance(seller), "ether").toNumber();
      buyerBalanceAfter = web3.fromWei(web3.eth.getBalance(buyer), "ether").toNumber();

      assert(sellerBalanceAfter == sellerBalanceBefore + itemPrice);
      assert(buyerBalanceAfter <= buyerBalanceBefore - itemPrice);

      return blockListInstance.getItem();
    }).then((data) => {
      assert.equal(data[0], seller);
      assert.equal(data[1], buyer);
      assert.equal(data[2], itemName);
      assert.equal(data[3], itemDescription);
      assert.equal(data[4].toNumber(), web3.toWei(itemPrice, 'ether'));
    });
  });

  it('should trigger an event when an item is sold', () => {
    return blockListInstance.
      sellItem(itemName, itemDescription, web3.toWei(itemPrice, "ether"), { from: seller }).
      then((receipt) => {
        assert.equal(receipt.logs.length, 1);
        assert.equal(receipt.logs[0].event, "LogSellItem");
        assert.equal(receipt.logs[0].args._seller, seller);
        assert.equal(receipt.logs[0].args._name, itemName);
        assert.equal(receipt.logs[0].args._price.toNumber(), web3.toWei(itemPrice, "ether"));
    });
  });
});
