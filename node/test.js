const fs = require("fs");

// traditional callback
// const readFileAsArray = function (file, cb) {
//   fs.readFile(file, function (err, data) {
//     if (err) {
//       return cb(err);
//     }
//     const lines = data.toString().trim().split("\n");
//     cb(null, lines);
//   });
// };
readFileAsArray("./numbers.txt", (err, lines) => {
  if (err) throw err;
  const numbers = lines.map(Number);
  const oddNumbers = numbers.filter((n) => n % 2 === 1);
  console.log("Odd numbers count:", oddNumbers.length);
});

// modern callback
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
readFileAsArray("./numbers.txt")
  .then((lines) => {
    const numbers = lines.map(Number);
    const oddNumbers = numbers.filter((n) => n % 2 === 1);
    console.log("Odd numbers count:", oddNumbers.length);
  })
  .catch(console.error);

//async callback
async function countOdd() {
  try {
    const lines = await readFileAsArray("./numbers.txt");
    const numbers = lines.map(Number);
    const oddCount = numbers.filter((n) => n % 2 === 1).length;
    console.log("Odd numbers count:", oddCount);
  } catch (err) {
    console.error(err);
  }
}
countOdd();
