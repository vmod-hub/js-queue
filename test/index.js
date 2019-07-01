import Queue from "../src/queue";
// import Queue from 'js-queue2';

async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(time);
      // reject(time)
    }, time);
  });
}

function test1() {
  // quick start 快速使用
  let queue = new Queue();

  queue
    .add(async () => {
      return sleep(2000);
    })
    .then(data => {
      console.log("1", data);
    });

  queue
    .add(() => {
      return sleep(1000);
    })
    .then(data => {
      console.log("2", data);
    });

  queue.getQueueData().then(data => {
    console.log("queue data", data);
  });
}

function test2() {
  // timeout 设置超时
  let queue = new Queue({
    timeout: 1500
  });

  queue
    .add(
      async () => {
        return sleep(2000);
      },
      {
        timeoutTip: "自定义的超时tip"
      }
    )
    .then(data => {
      console.log("1", data);
    });
  queue
    .add(() => {
      return sleep(1000);
    })
    .then(data => {
      console.log("2", data);
    });

  queue
    .add(
      options => {
        return sleep(3000);
      },
      {
        timeout: -1,
        timeoutTip: "-1 为不超时"
      }
    )
    .then(data => {
      console.log("3", data);
    });

  queue.getQueueData().then(data => {
    console.log("queue data", data);
  });
}

function test3() {
  // fast 并发模式
  let queue = new Queue({
    maxPending: 2
  });

  queue
    .add(async () => {
      return await sleep(3000);
    })
    .then(data => {
      console.log("1", data);
    });

  queue
    .add(async () => {
      return await sleep(1000);
    })
    .then(data => {
      console.log("2", data);
    });

  queue
    .add(async () => {
      return await sleep(1000);
    })
    .then(data => {
      console.log("3", data);
    });

  queue.getQueueData().then(data => {
    console.log("queue data", data);
  });
}

function test4() {
  // part 分段并发模式
  let queue = new Queue({
    maxPending: 2,
    mode: "part"
  });

  queue
    .add(async () => {
      return await sleep(6000);
    })
    .then(data => {
      console.log("part-1 1", data);
    });

  queue
    .add(async () => {
      return await sleep(1000);
    })
    .then(data => {
      console.log("part-1 2", data);
    });

  queue
    .add(async () => {
      return await sleep(3000);
    })
    .then(data => {
      console.log("part-2 1", data);
    });

  queue
    .add(async () => {
      return await sleep(1000);
    })
    .then(data => {
      console.log("part-2 2", data);
    });

  queue
    .add(async () => {
      return await sleep(3000);
    })
    .then(data => {
      console.log("part-3 1", data);
    });

  queue.getQueueData().then(data => {
    console.log("queue data", data);
  });
}

function test5() {
  // priority 优先级
  let queue = new Queue();

  queue
    .add(async () => {
      return sleep(3000);
    })
    .then(data => {
      console.log("1", data);
    });

  queue
    .add(
      () => {
        return sleep(1000);
      },
      {
        index: 9
      }
    )
    .then(data => {
      console.log("2", data);
    });

  queue
    .add(
      () => {
        return sleep(2000);
      },
      {
        index: 10
      }
    )
    .then(data => {
      console.log("3", data);
    });

  queue.getQueueData().then(data => {
    console.log("queue data", data);
  });
}

function main() {
  // test1();
  // test2();
  // test3();
  test4();
  // test5();
}

main();
