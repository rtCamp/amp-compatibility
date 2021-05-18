/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!****************************************!*\
  !*** ./resources/js/adhoc-requests.js ***!
  \****************************************/
window.addEventListener('DOMContentLoaded', function (event) {
  var addAdhocSyntheticData = {
    pluginRowCounter: 1,
    init: function init() {
      var _this = this;

      this.preparePluginRow();
      this.prepareThemeRow();
      /**
       * Events.
       */

      $('[name="amp_source"]').on('change', this.onAMPSourceChange);
      $(document).on('click', '.dropdown-item', this.onDropdownItemClick);
      $('#addNewPlugin').on('click', function () {
        _this.onAddNewPluginClick();
      });
    },

    /**
     * Callback function of change event of amp plugin source.
     *
     * @return void
     */
    onAMPSourceChange: function onAMPSourceChange() {
      var ampSource = $(this).val();

      if ('other' === ampSource) {
        $('#amp_source_url').removeAttr('disabled');
      } else {
        $('#amp_source_url').attr('disabled', 'true');
      }
    },

    /**
     * Callback function of version dropdown item click event.
     *
     * @return void
     */
    onDropdownItemClick: function onDropdownItemClick() {
      var version = $(this).data('value');
      $(this).parents('.dropdown').find('.hiddenThemeVersion').val(version);
      $(this).parents('.dropdown').find('.hiddenPluginVersion').val(version);
      $(this).parents('.dropdown').find('button').text($(this).text());
    },

    /**
     * callback function of add new plugin button click event.
     *
     * @return void
     */
    onAddNewPluginClick: function onAddNewPluginClick() {
      this.pluginRowCounter++;
      this.removeDuplicatePlugins();
      var clonedItem = $('#pluginClone').clone();
      clonedItem.removeAttr('id');
      clonedItem.removeClass('d-none');
      $('#plugin-name', clonedItem).attr('name', "plugins[".concat(this.pluginRowCounter, "][name]")).removeAttr('id');
      $('#plugin-version', clonedItem).attr('name', "plugins[".concat(this.pluginRowCounter, "][version]")).removeAttr('id');
      $('#plugin-list').append(clonedItem);
      this.preparePluginRow();
    },

    /**
     * Remove duplicate plugins.
     *
     * @return void
     */
    removeDuplicatePlugins: function removeDuplicatePlugins() {
      var nodesList = {};
      $('.plugin-autocomplete').each(function () {
        var nodeLength = $('.plugin-autocomplete').length;
        var innerValue = $(this).val();
        nodeLength > 2 && nodesList[innerValue] ? $(this).parent().remove() : nodesList[innerValue] = true;
      });
    },

    /**
     * Prepare plugins row.
     *
     * @return void
     */
    preparePluginRow: function preparePluginRow() {
      $('.plugin-autocomplete').autocomplete({
        minLength: 3,
        source: function source(request, response) {
          var searchTerm = request.term;
          $.getJSON("/admin/extensions/search/?type=plugin&s=".concat(searchTerm), function (httpResponse) {
            if ('ok' === httpResponse.status) {
              var extensionSlugs = [];

              for (var index in httpResponse.data) {
                extensionSlugs.push({
                  value: httpResponse.data[index].slug,
                  label: httpResponse.data[index].name,
                  versions: httpResponse.data[index].versions
                });
              }

              response(extensionSlugs);
            }
          });
        },
        select: function select(event, ui) {
          var versions = ui.item.versions || [];
          var dropDownElement = $(event.target).siblings().find('.plugin-dropdown');
          $(dropDownElement).html('');
          $(dropDownElement).append("<li><a class=\"dropdown-item\" data-value=\"\" href=\"#\">Latest Version</a></li>");
          versions.map(function (data) {
            $(dropDownElement).append("<li><a class=\"dropdown-item\" data-value=\"".concat(data, "\" href=\"#\">").concat(data, "</a></li>"));
          });
        }
      });
      $('.btn-remove-plugin').on('click', function () {
        var removeButtons = $('#plugin-list').find('.btn-remove-plugin').length;
        removeButtons > 2 ? $(this).parent('.plugin-item').remove() : null;
      });
    },

    /**
     * To Prepare theme row.
     *
     * @return void
     */
    prepareThemeRow: function prepareThemeRow() {
      $('.theme-autocomplete').autocomplete({
        minLength: 3,
        source: function source(request, response) {
          var searchTerm = request.term;
          $.getJSON("/admin/extensions/search/?type=theme&s=".concat(searchTerm), function (httpResponse) {
            if ('ok' === httpResponse.status) {
              var extensionSlugs = [];

              for (var index in httpResponse.data) {
                extensionSlugs.push({
                  value: httpResponse.data[index].slug,
                  label: httpResponse.data[index].name,
                  versions: httpResponse.data[index].versions
                });
              }

              response(extensionSlugs);
            }
          });
        },
        select: function select(event, ui) {
          var versions = ui.item.versions || [];
          var dropDownElement = $(event.target).siblings().find('.theme-dropdown');
          $(dropDownElement).html('');
          $(dropDownElement).append("<li><a class=\"dropdown-item\" data-value=\"\" href=\"#\">Latest Version</a></li>");
          versions.map(function (data) {
            $(dropDownElement).append("<li><a class=\"dropdown-item\" data-value=\"".concat(data, "\" href=\"#\">").concat(data, "</a></li>"));
          });
        }
      });
    }
  };
  addAdhocSyntheticData.init();
});
/******/ })()
;