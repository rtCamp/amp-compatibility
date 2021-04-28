/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*******************************************!*\
  !*** ./resources/js/verify-extensions.js ***!
  \*******************************************/
window.addEventListener('DOMContentLoaded', function () {
  var verifyExtensions = {
    /**
     * Init function.
     *
     * @return void
     */
    init: function init() {
      var _this = this;

      var checkboxes = document.querySelectorAll('.extension-verify-status');
      checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', _this.onStatusChange);
      });
    },

    /**
     * Callback function of checkbox change event.
     * To update extension verification mark.
     *
     * @return void
     */
    onStatusChange: function onStatusChange() {
      var _this2 = this;

      var statusLabel = {
        known_issues: 'Known Issues',
        unverified: 'Unverified',
        human_verified: 'Human Verified',
        auto_verified: 'Auto Verified'
      };
      var extensionDetail = {
        name: this.dataset.extensionName,
        version: this.dataset.extensionVersion
      };
      var extensionVersionSlug = this.dataset.extensionVersionSlug;
      var status = this.value;

      if (!extensionVersionSlug) {
        return;
      }

      this.disabled = true;
      jQuery.post('/admin/verify-extensions', {
        extensionVersionSlug: extensionVersionSlug,
        verificationStatus: status
      }, function (data) {
        var messageContainer = document.getElementById('messageContainer');
        var messageElement = document.createElement('p');

        if ('ok' === data.status) {
          messageElement.classList.add('text-success');
          messageElement.innerText = "Extension \"".concat(extensionDetail.name, " - ").concat(extensionDetail.version, "\" successfully marked as \"").concat(statusLabel[status], "\"");
        } else {
          messageElement.classList.add('text-danger');
          messageElement.innerText = "Failed to mark \"".concat(extensionDetail.name, " - ").concat(extensionDetail.version, "\" as \"").concat(statusLabel[status], "\"");
        }

        _this2.disabled = false;
        messageContainer.append(messageElement);
        setTimeout(function () {
          messageContainer.removeChild(messageElement);
        }, 10000);
      });
    }
  };
  verifyExtensions.init();
});
/******/ })()
;