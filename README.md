# js-queue
Handle js queue tasks，as concurrency，timeout, part, priority and more.


### features 主要特性
- queue 队列
- concurrency 并发队列
- part concurrency 分段并发队列
- timeout 任务超时
- priority  优先级

### Usage

##### Install.
```
git clone https://github.com/vmod-hub/js-queue.git
npm install
npm run test

npm install `js-queue2`
```

ES6, CommonJS, and UMD builds are available with each distribution.

##### quick start

```
async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(time);
    }, time);
  });
}

let queue = new Queue();

queue
  .add(async () => {
    return sleep(2000);
  })

queue
  .add(() => {
    return sleep(1000);
  })

let data = await queue.getQueueData();
console.log("queue data", data);
```
##### timeout

```
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
```
 ##### concurrency

```
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
```
##### part concurrency

```
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
  
```

##### more

```
npm run test
```
