"use strict";

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Queue = function () {
  function Queue() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Queue);
    this.DONE = 0;
    this.ERROR = -1;
    this.TIMEOUT = -2;
    this.INVALID = -3;
    this.id = 0;
    this.pending = 0;
    this.queue = [];
    this.data = [];
    this.maxPending = 1;
    this.maxQueued = 500;
    this.options = {
      mode: "fast",
      timeout: -1,
      timeoutTip: "timeout"
    };

    this.maxPending = options.maxPending || this.maxPending;
    this.maxQueued = options.maxQueued || this.maxQueued;
    this.options = (0, _extends3.default)({}, this.options, options);
  }

  (0, _createClass3.default)(Queue, [{
    key: "resolveQueue",
    value: function resolveQueue() {}
  }, {
    key: "resolveWith",
    value: function resolveWith(value) {
      if (value && typeof value.then === "function") {
        return value;
      }
      return _promise2.default.resolve(value);
    }
  }, {
    key: "getTimeoutPromise",
    value: function getTimeoutPromise(options) {
      var _this = this;

      var _options$timeout = options.timeout,
          timeout = _options$timeout === undefined ? this.options.timeout : _options$timeout;
      var _options$timeoutTip = options.timeoutTip,
          timeoutTip = _options$timeoutTip === undefined ? this.options.timeoutTip : _options$timeoutTip;

      return new _promise2.default(function (resolve, reject) {
        setTimeout(function () {
          reject({
            code: _this.TIMEOUT,
            value: timeoutTip
          });
        }, timeout);
      });
    }
  }, {
    key: "done",
    value: function done() {
      var _this2 = this;

      if (this.queue.length == 0 && this.pending == 0) {
        var resolveData = _lodash2.default.sortBy(this.data, ["id"]).map(function (item) {
          delete item.id;
          return item;
        });
        var success = resolveData.filter(function (item) {
          return item.code === _this2.DONE;
        }).length;
        var error = resolveData.filter(function (item) {
          return item.code !== _this2.DONE;
        }).length;
        this.resolveQueue({
          total: resolveData.length,
          success: success,
          error: error,
          data: resolveData
        });
        this.data.splice(0);
        this.id = 0;
      }
    }
  }, {
    key: "sort",
    value: function sort() {
      this.queue = _lodash2.default.sortBy(this.queue, function (item) {
        return -item.index;
      });
    }
  }, {
    key: "add",
    value: function add(promiseGenerator) {
      var _this3 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return new _promise2.default(function (resolve, reject) {
        if (_this3.queue.length >= _this3.maxQueued) {
          console.log("Queue limit reached");
          return;
        }

        _this3.queue.push({
          id: _this3.id,
          promiseGenerator: promiseGenerator,
          resolve: resolve,
          reject: reject,
          index: options.index || 0,
          options: options
        });

        _this3.sort();

        _this3.id++;
        _this3.dequeue();
      });
    }
  }, {
    key: "dequeue",
    value: function dequeue() {
      var _this4 = this;

      if (this.pending >= this.maxPending) {
        return false;
      }

      var item = this.queue.shift();
      if (!item) {
        if (this.options.onEmpty) {
          this.options.onEmpty();
        }
        return false;
      }

      var id = item.id,
          options = item.options;

      if (this.options.onCheck && typeof this.options.onCheck === "function") {
        if (!this.options.onCheck(item)) {
          var info = {
            code: this.INVALID,
            value: "invalid",
            options: options
          };
          item.resolve(info);
          this.data.push((0, _extends3.default)({ id: id }, info));
          this.dequeue();
          return false;
        }
      }

      try {
        this.pending++;

        this.getItemPromise(item).then(function (value) {
          _this4.pending--;

          var info = {
            code: _this4.DONE,
            value: value,
            options: options
          };
          item.resolve(info);
          _this4.data.push((0, _extends3.default)({ id: id }, info));

          _this4.end();
        }).catch(function (err) {
          _this4.pending--;

          var info = {
            code: (typeof err === "undefined" ? "undefined" : (0, _typeof3.default)(err)) === "object" && err.code || _this4.ERROR,
            value: (typeof err === "undefined" ? "undefined" : (0, _typeof3.default)(err)) === "object" && err.value || err,
            options: options
          };

          item.resolve(info);
          _this4.data.push((0, _extends3.default)({ id: id }, info));

          _this4.end();
        });
      } catch (err) {
        this.pending--;

        var _info = {
          code: (typeof err === "undefined" ? "undefined" : (0, _typeof3.default)(err)) === "object" && err.code || this.ERROR,
          value: (typeof err === "undefined" ? "undefined" : (0, _typeof3.default)(err)) === "object" && err.value || err,
          options: options
        };

        item.resolve(_info);
        this.data.push((0, _extends3.default)({ id: id }, _info));

        this.end();
      }

      return true;
    }
  }, {
    key: "getItemPromise",
    value: function getItemPromise(item) {
      var options = item.options;
      var _options$timeout2 = options.timeout,
          timeout = _options$timeout2 === undefined ? this.options.timeout : _options$timeout2;


      var taskPromise = this.resolveWith(item.promiseGenerator(options));
      if (timeout >= 0 && typeof timeout === "number") {
        return _promise2.default.race([taskPromise, this.getTimeoutPromise(options)]);
      }
      return taskPromise;
    }
  }, {
    key: "end",
    value: function end() {
      this.done();
      if (this.options.mode === "part") {
        if (this.pending === 0) {
          for (var i = 0; i < this.maxPending; i++) {
            this.dequeue();
          }
        }
        return;
      }
      this.dequeue();
    }
  }, {
    key: "getPendingLength",
    value: function getPendingLength() {
      return this.pending;
    }
  }, {
    key: "getQueueLength",
    value: function getQueueLength() {
      return this.queue.length;
    }
  }, {
    key: "getQueueData",
    value: function getQueueData() {
      var _this5 = this;

      return new _promise2.default(function (resolve) {
        _this5.resolveQueue = resolve;
        if (_this5.queue.length == 0 && _this5.pending == 0) {
          _this5.done();
        }
      });
    }
  }]);
  return Queue;
}();

module.exports = Queue;
