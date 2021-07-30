// import * as kafka from 'kafka-node'
// import { Client, Producer, Consumer, KeyedMessage } from 'kafka-node'

// const client = new Client('http://host:2181')

// const producer = new Producer(client, {})

// const km = new KeyedMessage('key', 'message')

// const payloads = [
//   { topic: 'topic1', messages: 'hi', partition: 0 },
//   { topic: 'topic2', messages: ['hello', 'world', km] }
// ];


// producer.createTopics(['topic1', 'topic2'], false, function (err, data) {
//   console.log(data);
// });

// producer.on('ready', function () {
//   producer.send(payloads, function (err, data) {
//     console.log(data);
//   });
// })

// producer.on('error', function (err) {
//   console.warn(err)
// })
