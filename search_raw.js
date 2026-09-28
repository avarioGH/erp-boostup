const fs = require('fs');
const path = require('path');
function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}
walk('backend/src', function(err, results) {
  if (err) throw err;
  let hasRaw = false;
  results.filter(f => f.endsWith('.ts')).forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('runCommandRaw') || content.includes('aggregateRaw') || content.includes('findRaw')) {
      console.log('RAW MONGO IN: ' + f.substring(f.indexOf('backend\\src')));
      hasRaw = true;
    }
  });
  if (!hasRaw) console.log('NO RAW MONGO QUERIES FOUND.');
});
