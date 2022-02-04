const PUBLIC_SERVER = "wss://s.altnet.rippletest.net/"
const client = new xrpl.Client(PUBLIC_SERVER)

function saveAddressInStorage(address, secret, oldaddress, seed) {
  var addresses = JSON.parse(localStorage.getItem("addresses"));
  if(addresses != null) {
    addresses.push({address:address, key: secret, oldaddress:oldaddress, seed:seed});
    
  }
  else {
    addresses = []
    addresses.push({address:address, key: secret, oldaddress:oldaddress, seed:seed});
  }
  localStorage.setItem("addresses", JSON.stringify(addresses));
}



function getFirstAddress() {
  var addresses = JSON.parse(localStorage.getItem("addresses"));
  return addresses[0];
}

async function sendTransaction() {
  var address = getFirstAddress();
  var recipient = $('#trx_address').val();
  if(recipient == '') {
    $('#errorTrx').css("display","block");
    $('#errorTrx').text("Recipient is invalid");
    return;
  }
  var amount = $('#trx_amount').val();
  if(amount == '') {
    $('#errorTrx').css("display","block");
    $('#errorTrx').text("Amount is invalid");
    return;
  }

  const prepared = await client.autofill({
    "TransactionType": "Payment",
    "Account": address.oldaddress,
    "Amount": xrpl.xrpToDrops(amount),
    "Destination": recipient
  });

  $('.valid-feedback').css('display','block');
  $('.valid-feedback').text('Executing transaction.');

  const wallet = xrpl.Wallet.fromSeed(address.seed)
  const signed = wallet.sign(prepared)
  const tx = await client.submitAndWait(signed.tx_blob)

  

  if(tx.result.meta.TransactionResult === "tesSUCCESS") {
    $('#trx_address').val("");
    $('#trx_amount').val("");
    $('.valid-feedback').css('display','block');
    $('.valid-feedback').text('Transaction was executed successfully.');
    checkBalance();
    $('.invalid-feedback').css('display','none');
  }
  else {
    $('.valid-feedback').css('display','none');
    $('.invalid-feedback').css('errorTrx1','block');
    $('.valid-feedback').text('Transaction was executed with errors. Try again.');
  }
}


async function generateWallet()
{
  await client.connect();
  const fund_result = await client.fundWallet()
    console.log(fund_result);
    $('#new_address_generated').show();
    $('#new_wallet_address').text(fund_result.wallet.publicKey);
    $('#new_wallet_seed').text(fund_result.wallet.seed);
    $('#new_wallet_secret').text(fund_result.wallet.privateKey);
    $('#new_wallet_classicAddress').text(fund_result.wallet.classicAddress);
    saveAddressInStorage(fund_result.wallet.publicKey, fund_result.wallet.privateKey, fund_result.wallet.classicAddress, fund_result.wallet.seed);
    client.disconnect();
}

function confirmKeySaved() {
  localStorage.authenticated = "true";
  location.href = 'index.html';
}

function generateWalletFromPrivateKey()
{
    const privateKey = $('#pvKeyValue').val();
    if(privateKey != '') {
      const wallet = xrpl.Wallet.fromSeed(privateKey) // Test secret; don't use for real
      
      saveAddressInStorage(wallet.publicKey, wallet.privateKey, wallet.classicAddress, wallet.seed);
      confirmKeySaved();
    }
    else {
      $('#errorLogin').css("display","block");
        $('#errorLogin').text('The seed is not valid.');
        
    }
}

async function checkBalance()
{
  await client.connect();
    const publicAddress = getFirstAddress().oldaddress;
    const response = await client.request({
      "command": "account_info",
      "account": publicAddress,
      "ledger_index": "validated"
    });
    $('.view_balance_address').text(xrpl.dropsToXrp(response.result.account_data.Balance));

    //client.disconnect();
}

async function checkCurrentBlock() {
  await client.connect();
  client.request({
    "command": "subscribe",
    "streams": ["ledger"]
  })
  client.on("ledgerClosed", async (ledger) => {
    $('.view_block_number').text(ledger.ledger_index);
  })
}


function logout() {
  localStorage.clear();
  location.href = 'login.html';
}
    

$(function()
{
  if(localStorage.authenticated != null) {
    checkBalance();
    var address = getFirstAddress().oldaddress;
    $('.current_account').qrcode(address);
    $('.current_account_text').text(address);
    checkCurrentBlock();

  }
  
    $('#generateWalletButton').click(
        function() {
        generateWallet()});

    $('#generateWalletPrivKeyButton').click(
        function() {
            generateWalletFromPrivateKey()});

    $('#confirmKeySavedButton').click(
      function() {
        confirmKeySaved()});

    $('#verifyAddressButton').click(
      function() {
        checkAddress()});
    $('#btnLogout').click(
      function() {
        logout()});

    $('#sendTrxButton').click(
      function() {
        sendTransaction()});
    
}
    
);