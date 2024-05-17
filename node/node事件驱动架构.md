# EventEmitter

今天看了一篇文章，记录一下心得体会，链接[Understanding Node.js Event-Driven Architecture (freecodecamp.org)](https://www.freecodecamp.org/news/understanding-node-js-event-driven-architecture-223292fcbc2d)

在做node中间层的工作时候，经常会遇到需要写一些服务，类似

```js
app.on("close", callback)
socket.on("connect", callback)
server.("when-ready", callback)
...
```

之类的代码，以前也没有仔细研究过，今天读了这篇文章，让我对其中的原理有了更深入的认知

### callback

*原文：Most of Node’s objects — like HTTP requests, responses, and streams — implement the `EventEmitter` module so they can provide a way to emit and listen to events.*

events是node的一个模块，这个模块负责一处理些事件驱动的业务。

回调函数被广泛应用于事件驱动场景中，在那个没有promise和async/await的年代，想要异步执行就要使用callback。

**callback ！== 异步**

回调不总是意味着异步，比如

```js
function fileSize (fileName, cb) {
  if (typeof fileName !== 'string') {
    return cb(new TypeError('argument should be string')); // Sync
  }
  fs.stat(fileName, (err, stats) => {
    if (err) { return cb(err); } // Async
    cb(null, stats.size); // Async
  });
}
```

这是不好的写法，在设计一个函数的时候，请确保他永远是同步或者异步的，而不是存在二相性

**traditional callback**

```js

// traditional callback
const readFileAsArray = function (file, cb) {
  fs.readFile(file, function (err, data) {
    if (err) {
      return cb(err);
    }
    const lines = data.toString().trim().split("\n");
    cb(null, lines);
  });
};

readFileAsArray("./numbers.txt", (err, lines) => {
  if (err) throw err;
  const numbers = lines.map(Number);
  const oddNumbers = numbers.filter((n) => n % 2 === 1);
  console.log("Odd numbers count:", oddNumbers.length);
});
```

这种传统方案中，我们把回调函数作为参数传入给函数，他的业务处理和错误处理都写在了一起，不是很美观，可能会出现回调地狱


**Promiise**

更现代一点的回调，我们只需要把上述的readFileAsArray做一些改变，引入promise对象，能让代码更美观

```js
const readFileAsArray = function (file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, function (err, data) {
      if (err) {
        reject(err);
      }
      const lines = data.toString().trim().split("\n");
      resolve(lines);
    });
  });
};
```



这样就能使用then和catch来链式调用，处理业务逻辑，代码能更加清晰

```js
readFileAsArray("./numbers.txt")
  .then((lines) => {
    const numbers = lines.map(Number);
    const oddNumbers = numbers.filter((n) => n % 2 === 1);
    console.log("Odd numbers count:", oddNumbers.length);
  })
  .catch(console.error);
```


**async/await**

async/await的出现更加简化了异步的处理，使得异步函数的写法如同步的写法一样，更加贴近js本身

```js
async function countOdd () {
  try {
    const lines = await readFileAsArray('./numbers');
    const numbers = lines.map(Number);
    const oddCount = numbers.filter(n => n%2 === 1).length;
    console.log('Odd numbers count:', oddCount);
  } catch(err) {
    console.error(err);
  }
}
countOdd();
```


### EventEmitter模块

用于构建异步的事件驱动架构

```js
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
myEmitter.emit('something-happened');
```

我们可以使用on方法来注册一个listener，这个listener会在emmit出发的时候，执行listener的回调

```js
const EventEmitter = require('events');

class WithLog extends EventEmitter {
  execute(taskFunc) {
    console.log('Before executing');
    this.emit('begin');
    taskFunc();
    this.emit('end');
    console.log('After executing');
  }
}

const withLog = new WithLog();

withLog.on('begin', () => console.log('About to execute'));
withLog.on('end', () => console.log('Done with execute'));

withLog.execute(() => console.log('*** Executing task ***')); 
//执行结果
Before executing
About to execute
*** Executing task ***
Done with execute
After executing
```

可以看到上述的代码都是同步的，而非异步的

如果修改一下callback，将callback改为异步函数

```js
withLog.execute(() => {
  setImmediate(() => {
    console.log('*** Executing task ***')
  });
});

//执行结果
Before executing
About to execute
Done with execute
After executing
*** Executing task ***
```

可以发现执行顺序并不是我们想要的那样


在修改一下代码，用正常的顺序打印出来

```js
const fs = require('fs');
const EventEmitter = require('events');

class WithTime extends EventEmitter {
  execute(asyncFunc, ...args) {
    this.emit('begin');
    console.time('execute');
    asyncFunc(...args, (err, data) => {
      if (err) {
        return this.emit('error', err);
      }

      this.emit('data', data);
      console.timeEnd('execute');
      this.emit('end');
    });
  }
}

const withTime = new WithTime();

withTime.on('begin', () => console.log('About to execute'));
withTime.on('end', () => console.log('Done with execute'));

withTime.execute(fs.readFile, __filename);
About to execute
execute: 4.507ms
Done with execute

```

读起来有点费力

使用async/await改写

```js
class WithTime extends EventEmitter {
  async execute(asyncFunc, ...args) {
    this.emit('begin');
    try {
      console.time('execute');
      const data = await asyncFunc(...args);
      this.emit('data', data);
      console.timeEnd('execute');
      this.emit('end');
    } catch(err) {
      this.emit('error', err);
    }
  }
}
```

当需要处理数据的时候

```js
withTime.on('data', (data) => {
  // do something with data
});
```
