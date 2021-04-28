/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*************************************!*\
  !*** ./resources/js/queue-table.js ***!
  \*************************************/
window.addEventListener('DOMContentLoaded', function () {
  var queueTables = {
    /**
     * Init method.
     *
     * @return void
     */
    init: function init() {
      var _this = this;

      var actionButtons = document.querySelectorAll('.btn-actions');
      actionButtons.forEach(function (checkbox) {
        checkbox.addEventListener('click', _this.onActionButtonClick);
      });
    },

    /**
     * Callback handler for on click event of action button.
     *
     * @return void
     */
    onActionButtonClick: function onActionButtonClick() {
      var _this2 = this;

      var action = this.dataset.action || '';
      var jobID = this.dataset.jobid || '';

      if (!action || !jobID) {
        return;
      }

      this.disabled = true;
      jQuery.post(window.location.href, {
        action: action,
        jobID: jobID
      }, function (data) {
        var messageContainer = document.getElementById('messageContainer');
        var messageElement = document.createElement('p');
        messageElement.innerText = data.message;

        if ('ok' === data.status) {
          messageElement.classList.add('text-success');
          jQuery("[data-jobid=\"".concat(jobID, "\"]")).remove();
        } else {
          messageElement.classList.add('text-danger');
          _this2.disabled = false;
        }

        messageContainer.append(messageElement);
        setTimeout(function () {
          messageContainer.removeChild(messageElement);
        }, 10000);
      });
    }
  };
  queueTables.init();
});
/******/ })()
;