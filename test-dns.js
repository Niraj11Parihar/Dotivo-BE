const dns = require('dns');
dns.resolveSrv('_mongodb._tcp.dotivoclustor1.1mjmvzn.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS SRV resolution failed:', err);
  } else {
    console.log('DNS SRV resolution success:', addresses);
  }
});
