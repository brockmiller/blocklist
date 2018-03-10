App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // initialize web3
    if(typeof web3 !== 'undefined') {
      // use provider of the Web3 object injected by Metamask
      App.web3Provider = web3.currentProvider;
    } else {
      // create a new provider which connects to my local ganache network
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase((err, account) => {
      if(err === null) {
        App.account = account;
        // Inject the account number into the HTML
        $('#account').text(account);

        web3.eth.getBalance(account, (err, balance) => {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether") + " ETH");
          }
        });
      }
    });
  },

  initContract: function() {
    $.getJSON('BlockList.json', (artifact) => {
      // get the contract artifact file and use it to instantiate a truffle contract abstraction
      App.contracts.BlockList = TruffleContract(artifact);
      // set the provider for our contracts
      App.contracts.BlockList.setProvider(App.web3Provider);

      App.listenToEvents();

      return App.reloadItems();
    });
  },

  reloadItems: function() {
    // refresh account information because the balance might have changed
    App.displayAccountInfo();

    // retrieve the item placeholder and clear it
    $('#itemsRow').empty();

    App.contracts.BlockList.deployed().then((instance) => {
      return instance.getItem();
    }).then((item) => {
      if(item[0] == 0x0) {
        // no item
        return;
      }

      const price = web3.fromWei(item[4], 'ether');

      // retrieve the item template and fill it
      const itemTemplate = $('#itemTemplate');
      itemTemplate.find('.panel-title').text(item[2]);
      itemTemplate.find('.item-description').text(item[3]);
      itemTemplate.find('.item-price').text(price);
      itemTemplate.find('.btn-buy').attr('data-value', price);

      let seller = item[0];
      let buyer = item[1];
      if (seller == App.account || buyer != 0x0) {
        itemTemplate.find('.btn-buy').hide();
      } else {
        itemTemplate.find('.btn-buy').show();
      }

      if (seller == App.account) {
        seller = "You";
      }
      itemTemplate.find('.item-seller').text(seller);

      if (buyer == App.account) {
        buyer = "You";
      } else if (buyer == 0x0) {
        buyer = "<Unpurchased>";
      }
      itemTemplate.find('.item-buyer').text(buyer);

      // add this item
      $('#itemsRow').append(itemTemplate.html());
    }).catch((err) => {
      console.error(err.message);
    });
  },

  sellItem: function() {
    // retrieve the detail of the item
    var _item_name = $('#item_name').val();
    var _description = $('#item_description').val();
    var _price = web3.toWei(parseFloat($('#item_price').val() || 0), "ether");

    if((_item_name.trim() == '') || (_price == 0)) {
      // nothing to sell
      return false;
    }

    App.contracts.BlockList.deployed().then((instance) => {
      return instance.sellItem(_item_name, _description, _price, {
        from: App.account,
        gas: 500000
      });
    }).then((result) => {
      // success
    }).catch((err) => {
      console.error(err);
    });
  },

  // listen to events triggered by the contract
  listenToEvents: function() {
    App.contracts.BlockList.deployed().then((instance) => {
      instance.LogSellItem({}, {}).watch((error, event) => {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>');
        } else {
          console.error(error);
        }
        App.reloadItems();
      });

      instance.LogBuyItem({}, {}).watch((error, event) => {
        if (!error) {
          $("#events").append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>');
        } else {
          console.error(error);
        }
        App.reloadItems();
      });
    });
  },

  buyItem: function() {
    event.preventDefault();

    let _price = parseFloat($(event.target).data('value'));

    App.contracts.BlockList.deployed().
      then((instance) => {
        return instance.buyItem({
          from: App.account,
          value: web3.toWei(_price, 'ether'),
          gas: 500000
        });
      }).
      catch((err) => console.error(err));
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
