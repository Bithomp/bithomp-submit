(function() {

var api = new ripple.RippleAPI({server: 'wss://s1.ripple.com'});
var explorer = 'https://bithomp.com/explorer/';

var DOM = {};
DOM.txBlob = $('#txBlob');
DOM.feedback = $('#feedback');
DOM.submit = $('#submit');
DOM.thisYear = $('#thisYear');

function init() {
  thisYear();
  DOM.submit.on("click", submit);
  DOM.txBlob.on("change keyup paste", txBlobChanged);
}

function txBlobChanged() {
  DOM.feedback.html('');
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

  api.connect().then(function() {
    api.submit(
      blob
    ).then(function(result) {
      DOM.feedback.html(result.resultMessage);
      DOM.submit.html(buttonValue);
    }).catch(function (error) {
      DOM.feedback.html(error.message);
      DOM.submit.html(buttonValue);
    });
  }).catch(function(err) {
    DOM.feedback.html('connect: ' + err.resultMessage);
    console.log(err);
    DOM.submit.html(buttonValue);
  });

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