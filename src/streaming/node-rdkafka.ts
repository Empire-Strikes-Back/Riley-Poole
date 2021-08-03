const kafka = require('node-rdkafka');
console.log(kafka.features);

const idDev = process.env.NODE_ENV == 'production' ? false : true

const ZOOKEEPER_ORIGIN = idDev ? 'host:9092' : 'localhost:9092'

console.log(kafka.librdkafkaVersion);

var producer = new kafka.Producer({
  'metadata.broker.list': ZOOKEEPER_ORIGIN
});


var stream = kafka.Producer.createWriteStream({
  'metadata.broker.list': ZOOKEEPER_ORIGIN
}, {}, {
    topic: 'streaming'
  });


var queuedSuccess = stream.write(new Buffer('Awesome message'));

if (queuedSuccess) {
  console.log('We queued our message!');
} else {
  // Note that this only tells us if the stream's queue is full,
  // it does NOT tell us if the message got to Kafka!  See below...
  console.log('Too many messages in our queue already');
}

stream.on('error', function (err) {
  // Here's where we'll know if something went wrong sending to Kafka
  console.error('Error in our kafka stream');
  console.error(err);
})


var producer = new kafka.Producer({
  'metadata.broker.list': ZOOKEEPER_ORIGIN,
  'dr_cb': true
});

// Connect to the broker manually
producer.connect();

producer.setPollInterval(1000);

producer.on('delivery-report', function (err, report) {
  // Report of delivery statistics here:
  //
  console.log(report);
});

// Wait for the ready event before proceeding
producer.on('ready', function () {
  try {
    producer.produce(
      // Topic to send the message to
      'streaming',
      // optionally we can manually specify a partition for the message
      // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
      null,
      // Message to send. Must be a buffer
      new Buffer('Awesome message'),
      // for keyed messages, we also specify the key - note that this field is optional
      'Stormwind',
      // you can send a timestamp here. If your broker version supports it,
      // it will get added. Otherwise, we default to 0
      Date.now(),
      // you can send an opaque token here, which gets passed along
      // to your delivery reports
    );
  } catch (err) {
    console.error('A problem occurred when sending our message');
    console.error(err);
  }
});

// Any errors we encounter, including connection errors
producer.on('event.error', function (err) {
  console.error('Error from producer');
  console.error(err);
})



var streamRead = kafka.Consumer.createReadStream({
  'group.id': 'kafka',
  'metadata.broker.list': ZOOKEEPER_ORIGIN
}, {}, {
    topics: ['streaming']
  });

streamRead.on('data', function (message) {
  console.log('Got message');
  console.log(message.value.toString());
});

console.warn('read')
