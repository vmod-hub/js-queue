import _ from "lodash";

/**
 * author vmod
 * js-queue
 * Handle js queue tasks，as concurrency，timeout, part, priority and more.
 *
 * options = {
 *  maxPending: 1,
 *  maxQueued: 500,
 *  mode: 'fast' || 'part'
 *  timeout: -1,
 *  timeoutTip: '超时'
 * }
 *
 * @example
 * let queue = new Queue();
 *
 * queue.add(() => {
 *    return downloadFile()
 * })
 * queue.add(() => {
 *    return downloadFile2()
 * })
 *
 * let data = await queue.getQueueData()
 * console.log('queue data', data);
 *
 */
class Queue {
  DONE = 0;
  ERROR = -1;
  TIMEOUT = -2;
  INVALID = -3;

  id = 0;
  pending = 0;
  queue = [];
  data = [];

  maxPending = 1;
  maxQueued = 500;
  options = {
    mode: "fast", // 'fast' 'part'
    timeout: -1,
    timeoutTip: "timeout"
  };

  constructor(options = {}) {
    this.maxPending = options.maxPending || this.maxPending;
    this.maxQueued = options.maxQueued || this.maxQueued;
    this.options = {
      ...this.options,
      ...options
    };
  }

  /**
   * resolve the queue
   */
  resolveQueue() {}

  resolveWith(value) {
    if (value && typeof value.then === "function") {
      return value;
    }
    return Promise.resolve(value);
  }

  getTimeoutPromise(options) {
    let { timeout = this.options.timeout } = options;
    let { timeoutTip = this.options.timeoutTip } = options;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject({
          code: this.TIMEOUT,
          value: timeoutTip
        });
      }, timeout);
    });
  }

  done() {
    if (this.queue.length == 0 && this.pending == 0) {
      let resolveData = _.sortBy(this.data, ["id"]).map(item => {
        delete item.id;
        return item;
      });
      let success = resolveData.filter(item => item.code === this.DONE).length;
      let error = resolveData.filter(item => item.code !== this.DONE).length;
      this.resolveQueue({
        total: resolveData.length,
        success,
        error,
        data: resolveData
      });
      this.data.splice(0);
      this.id = 0;
    }
  }

  sort() {
    this.queue = _.sortBy(this.queue, item => -item.index);
  }

  /**
   * add task
   */
  add(promiseGenerator, options = {}) {
    return new Promise((resolve, reject) => {
      // Do not queue to much promises
      if (this.queue.length >= this.maxQueued) {
        console.log("Queue limit reached");
        return;
      }

      // Add to queue
      this.queue.push({
        id: this.id,
        promiseGenerator,
        resolve,
        reject,
        index: options.index || 0,
        options
      });
      // sort
      this.sort();

      this.id++;
      this.dequeue();
    });
  }

  dequeue() {
    if (this.pending >= this.maxPending) {
      return false;
    }

    // Remove from queue
    let item = this.queue.shift();
    if (!item) {
      if (this.options.onEmpty) {
        this.options.onEmpty();
      }
      return false;
    }

    let { id, options } = item;

    // check task can be do
    if (this.options.onCheck && typeof this.options.onCheck === "function") {
      if (!this.options.onCheck(item)) {
        let info = {
          code: this.INVALID,
          value: "invalid",
          options
        };
        item.resolve(info);
        this.data.push({ id, ...info });
        this.dequeue();
        return false;
      }
    }

    try {
      this.pending++;

      this.getItemPromise(item)
        .then(value => {
          this.pending--;

          //  pass values resolve
          let info = {
            code: this.DONE,
            value,
            options
          };
          item.resolve(info);
          this.data.push({ id, ...info });

          this.end();
        })
        .catch(err => {
          this.pending--;

          // pass values error
          let info = {
            code: (typeof err === "object" && err.code) || this.ERROR,
            value: (typeof err === "object" && err.value) || err,
            options
          };

          item.resolve(info);
          this.data.push({ id, ...info });

          this.end();
        });
    } catch (err) {
      this.pending--;

      let info = {
        code: (typeof err === "object" && err.code) || this.ERROR,
        value: (typeof err === "object" && err.value) || err,
        options
      };

      item.resolve(info);
      this.data.push({ id, ...info });

      this.end();
    }

    return true;
  }

  getItemPromise(item) {
    let { options } = item;
    let { timeout = this.options.timeout } = options;

    let taskPromise = this.resolveWith(item.promiseGenerator(options));
    if (timeout >= 0 && typeof timeout === "number") {
      return Promise.race([taskPromise, this.getTimeoutPromise(options)]);
    }
    return taskPromise;
  }

  end() {
    this.done();
    if (this.options.mode === "part") {
      if (this.pending === 0) {
        for (let i = 0; i < this.maxPending; i++) {
          this.dequeue();
        }
      }
      return;
    }
    this.dequeue();
  }
  /**
   * getPendingLength
   */
  getPendingLength() {
    return this.pending;
  }

  /**
   * getQueueLength
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * get the queue data
   */
  getQueueData() {
    return new Promise(resolve => {
      this.resolveQueue = resolve;
      if (this.queue.length == 0 && this.pending == 0) {
        this.done();
      }
    });
  }
}

module.exports = Queue;
