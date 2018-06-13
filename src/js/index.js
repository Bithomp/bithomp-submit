(function() {

var api = new ripple.RippleAPI({server: 'wss://s1.ripple.com'});
var explorer = 'https://bithomp.com/explorer/';

var DOM = {};
DOM.fee = $('#fee');
DOM.sequence = $('#sequence');
DOM.txBlob = $('#txBlob');
DOM.feedback = $('#feedback');
DOM.scan = $('#scan');
DOM.submit = $('#submit');
DOM.thisYear = $('#thisYear');
DOM.video = $('#video');
DOM.txHash = $('#tx-hash');

function init() {
  eraseData();
  thisYear();
  DOM.submit.on("click", submit);
  DOM.scan.on("click", scan);
  DOM.txBlob.on("change keyup paste", txBlobChanged);
  pull();
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
    if (tx.charAt(0) == '{') {
      tx = JSON.parse(tx);
      DOM.txBlob.val(tx.blob);
      DOM.txHash.html('Click in 10 seconds:<br><a href="' + explorer + tx.hash + '" target="_blank">' + tx.hash + '</a>');
      DOM.txBlob.attr("readonly", true);
    } else {
      DOM.txBlob.val(tx);
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

  var blob = DOM.txBlob.val();
  blob = blob.trim();

  if (blob == '') {
    DOM.feedback.html('Error: tx blob is empty');
    return;
  }

  if (!validateBlob(blob)) {
    DOM.feedback.html('Error: Incorrect transaction blob!');
    return;
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