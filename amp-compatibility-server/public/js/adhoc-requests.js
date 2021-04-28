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

      /* makes drop down function */
      $(document).on('click', '.dropdown-item', function () {
        /* updates the hidden value of verions */
        $(this).parents('.dropdown').find('.hiddenThemeVersion').val($(this).text());
        $(this).parents('.dropdown').find('.hiddenPluginVersion').val($(this).text());
        /* updates drop down button value */

        $(this).parents('.dropdown').find('button').text($(this).text());
      });
      this.pluginsData = [];
      this.themeData = [];
      /* fetch data for plugins autocomplete */

      $.getJSON("/data/wporg_mapping/plugins.json", [], function (data, status, xhr) {
        for (var index in data) {
          _this.pluginsData.push(data[index].slug);
        }

        _this.preparePluginRow();
      });
      /* fetch data for themes autocomplete */

      $.getJSON("/data/wporg_mapping/themes.json", [], function (data, status, xhr) {
        for (var index in data) {
          _this.themeData.push(data[index].slug);
        }

        _this.themeAutocomplete();
      });
      /* add new plugin button */

      $('#addNewPlugin').on('click', function () {
        /* duplicate plugin removal */
        _this.removeDuplicatePlugins();

        _this.pluginRowCounter++;
        var clonedItem = $('#pluginClone').clone();
        clonedItem.removeAttr('id');
        clonedItem.removeClass('d-none');
        $('#plugin-name', clonedItem).attr('name', "plugins[".concat(_this.pluginRowCounter, "][name]")).removeAttr('id');
        $('#plugin-version', clonedItem).attr('name', "plugins[".concat(_this.pluginRowCounter, "][version]")).removeAttr('id');
        $('#plugin-list').append(clonedItem);

        _this.preparePluginRow();
      });
      this.bindEvents();
    },

    /**
     * To bind all the events.
     *
     * @return void
     */
    bindEvents: function bindEvents() {
      jQuery('[name="amp_source"]').on('change', this.onAMPSourceChange);
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

    /* duplicate plugin removal code */
    removeDuplicatePlugins: function removeDuplicatePlugins() {
      var nodesList = {};
      $('.plugin-autocomplete').each(function () {
        var nodeLength = $('.plugin-autocomplete').length;
        var innerValue = $(this).val();
        nodeLength > 2 && nodesList[innerValue] ? $(this).parent().remove() : nodesList[innerValue] = true;
      });
    },

    /* fetch plugin name and add remove button */
    preparePluginRow: function preparePluginRow() {
      var pluginSrc = this.pluginsData;
      jQuery('.plugin-autocomplete').autocomplete({
        minLength: 3,
        source: function source(request, response) {
          var results = $.ui.autocomplete.filter(pluginSrc, request.term);
          response(results.slice(0, 10));
        }
      });
      jQuery('.btn-remove-plugin').on('click', function () {
        var removeButtons = $('#plugin-list').find('.btn-remove-plugin').length;
        removeButtons > 2 ? $(this).parent('.plugin-item').remove() : null;
      });
    },

    /* fetch theme names */
    themeAutocomplete: function themeAutocomplete() {
      var themeSrc = this.themeData;
      jQuery('.theme-autocomplete').autocomplete({
        minLength: 3,
        source: function source(request, response) {
          var results = $.ui.autocomplete.filter(themeSrc, request.term);
          response(results.slice(0, 20));
        }
      });
    },

    /* fetch theme versions */
    fetchThemeVersions: function fetchThemeVersions() {
      $('.theme-autocomplete').on('focusout', function () {
        var _this2 = this;

        /* update the drop down with new versions */
        $.getJSON("/data/wporg_mapping/themes.json", [], function (data, status, xhr) {
          $(_this2).siblings().find('.theme-dropdown').html("");

          for (var index in data) {
            var parent = $(_this2).val();

            if ("" !== parent && data[index].name === parent) {
              data[index].versions.map(function (data, index) {
                $(_this2).siblings().find('.theme-dropdown').append('<li><a class="dropdown-item" href="#">' + data + '</a></li>');
              });
            }
          }
        });
      });
    },

    /* fetch plugin versions */
    fetchPluginVersions: function fetchPluginVersions() {
      $(document).on('focusout', '.plugin-autocomplete', function () {
        var _this3 = this;

        /* update the drop down with new versions */
        $.getJSON("/data/wporg_mapping/plugins.json", [], function (data, status, xhr) {
          /* duplicate plugin removal */
          addAdhocSyntheticData.removeDuplicatePlugins();
          $(_this3).siblings().find('.plugin-dropdown').html("");

          for (var index in data) {
            var parent = $(_this3).val();

            if ("" !== parent && data[index].name === parent) {
              data[index].versions.map(function (data, index) {
                $(_this3).siblings().find('.plugin-dropdown').append('<li><a class="dropdown-item" href="#">' + data + '</a></li>');
              });
            }
          }
        });
      });
    }
  };
  addAdhocSyntheticData.init();
  addAdhocSyntheticData.fetchThemeVersions();
  addAdhocSyntheticData.fetchPluginVersions();
});
/******/ })()
;