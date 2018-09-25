(function() {

var api = new ripple.RippleAPI({server: 'wss://s1.ripple.com'});
var explorer = 'https://bithomp.com/explorer/';

var DOM = {};
DOM.mainBox = $('.main-box');
DOM.fee = $('#fee');
DOM.sequence = $('#sequence');
DOM.feedback = $('#feedback');
DOM.scan = $('#scan');
DOM.submit = $('#submit');
DOM.thisYear = $('#thisYear');
DOM.video = $('#video');
DOM.txHash = $('#tx-hash');
DOM.account = $('#account');
DOM.add = $('#add');

function init() {
  hideQrScan();
  eraseData();
  thisYear();
  DOM.submit.on("click", submit);
  DOM.scan.on("click", scan);
  DOM.add.on("click", add);
  DOM.mainBox.on("change keyup paste", ".tx-blob", txBlobChanged);
  pull();
}

function add() {
  var txList = $('.tx-blob');
  var countTX = txList.length;
  //max 20 tx, hide button to add more
  if (countTX == 19) {
    DOM.add.hide();
  }
  var lastTX = txList.eq(countTX-1);
  lastTX.clone().val('').insertAfter(lastTX);
}

function hideQrScan() {
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (iOS) {
    DOM.scan.hide();
  }
}

function eraseData() {
  DOM.txHash.html('');
  DOM.feedback.html('');
}

function scan() {
  DOM.video.show();

  let scanner = new Instascan.Scanner({
    video: document.getElementById('preview'),
    backgroundScan: false,
    mirror: false,
  });

  scanner.addListener('scan', function (tx) {
    var txList = $('.tx-blob');
    var countTX = txList.length;
    var lastTX = txList.eq(countTX-1);
    if (tx.charAt(0) == '{') {
      tx = JSON.parse(tx);
      lastTX.val(tx.signedTransaction);
      DOM.txHash.html('Click in 10 seconds:<br><a href="' + explorer + tx.id + '" target="_blank">' + tx.id + '</a>');
      lastTX.attr("readonly", true);
    } else {
      lastTX.val(tx);
    }
    scanner.stop();
    DOM.video.hide();
  });

  Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
      if (cameras.length > 1) {
        scanner.start(cameras[1]);
      } else {
        scanner.start(cameras[0]);
      }
    } else {
      console.error('No cameras found.');
    }
  }).catch(function (e) {
    console.error(e);
  });
}

function getSequence(address) {
  DOM.account.html('<a href="' + explorer + address + '" target="_blank">' + address + '</a><br><br>');
  api.getAccountInfo(address).then(function(info) {
    if (info && info.sequence) {
      DOM.sequence.html('<div class="info"><span>Next sequence:</span> <b class="orange">' + info.sequence + '</b></div>');
    } else {
      DOM.sequence.html("Error: can't find sequence");
    }
  }).catch(function (error) {
    if (error.message == 'actNotFound') {
      DOM.sequence.html('This account is not activated yet. <a href="https://bithomp.com/activation/' + address + '" target="_blank">Activate</a>');
    } else if (error.message == 'instance.address does not conform to the "address" format') {
      DOM.sequence.html('Incorrect ripple address in the url');
    } else {
      DOM.sequence.html('getAccountInfo: ' + error.message);
      console.log(error);
    }
    return false;
  })
}

function checkSequence() {
  var address = window.location.pathname.split("/").pop();
  if (address && address.length >= 25 && address.length <= 36 && address.charAt(0)) {
    getSequence(address);
  }
}

function pull() {
  connect_and_update();
  setInterval(function() {
    connect_and_update();
  }, 5000); //every 5 sec
}

function connect_and_update() {
  if (!api.isConnected()) {
    api.connect().then(function() {
      getFee();
      checkSequence();
    }).catch(function(err) {
      DOM.feedback.html('connect: ' + err.resultMessage);
      console.log(err);
    });
  } else {
    getFee();
    checkSequence();
  }
}

function getFee() {
  api.getFee().then(function(fee) {
    fee = parseFloat(fee);
    fee = fee.toFixed(6);
    if (fee > 1) fee = 1;
    DOM.fee.html('<div class="info"><span>Recommended fee:</span> <b>' + fee + '</b> XRP</div>');
    //console.log('fee updated');
  }).catch(function(err) {
    DOM.fee.html('getFee: ' + err.resultMessage);
    console.log(err);
  });
}

function txBlobChanged() {
  eraseData();
}

function submit() {
  DOM.feedback.html('');

  $('.tx-blob').each(function(i, obj) {
    $(this).attr("readonly", false);
  });

  var txhash = '';
  
  var txList = $('.tx-blob');
  var signedTransactions = [];
  var blobError = false;
  txList.each(function() {
    var blob = $(this).val();
    blob = blob.trim();
    if (blob.charAt(0) == '{') {
      var tx = JSON.parse(blob);
      blob = tx.signedTransaction;
      txhash = tx.id;
    } else {
      blob.replace(/['"]+/g, '');
    }
    if (blob != '') {
      if (!validateBlob(blob)) {
        DOM.feedback.html('Error: Incorrect transaction blob!');
        $(this).focus();
        blobError = true;
        return false;
      } else {
        signedTransactions.push(blob);
      }
    }
  });

  if (blobError) {
    return;
  }

  if (!signedTransactions.length) {
    DOM.feedback.html('Error: tx blob is empty');
    txList.eq(0).focus();
    return;
  }

  if (signedTransactions.length == 1) {
    var blob = signedTransactions[0];
  } else {
    //multisig
    try {
      var tx = api.combine(signedTransactions);
    }
    catch(error) {
      DOM.feedback.html(error.message);
      return;
    }
    var blob = tx.signedTransaction;
    txhash = tx.id;
  }

  if (txhash != '') {
    DOM.txHash.html('Click in 10 seconds:<br><a href="' + explorer + txhash + '" target="_blank">' + txhash + '</a>');
  }

  var buttonValue = addLoadingState(DOM.submit);

  if (api.isConnected()) {
    api.submit(
      blob
    ).then(function(result) {
      DOM.feedback.html(result.resultMessage);
      DOM.txHash.show();
      DOM.submit.html(buttonValue);
    }).catch(function (error) {
      DOM.feedback.html(error.message);
      DOM.submit.html(buttonValue);
    });
  } else {
    connect_and_updateFee();
    DOM.feedback.html('Error: Reconnecting, try again!');
  }
}

function addLoadingState(element) {
  var buttonValue = element.html();
  element.html('<div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div>');
  element.addClass('spinner');
  return buttonValue;
}

function thisYear() {
  var d = new Date();
  var n = d.getFullYear();
  DOM.thisYear.html(" - " + n);
}

function validateBlob(blob) {
  var re = /^[0-9A-F]*$/;
  return re.test(blob);
} 

init();

})();