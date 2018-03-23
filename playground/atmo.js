const netatmo = require('netatmo');

var auth = {
  "client_id": "5aa3d9b18c04c4e6b18babf6",
  "client_secret": "kqDz15LYia78X9bymV12U7ogDsYDPKGkK4y6WnnikQ",
  "username": "iphonelynden@gmail.com",
  "password": "control*88",
};

try  {
  var api = new netatmo(auth);
} catch (err) {
  console.log('Netatmo could not be initialized ', err);
  if (offline) {
    console.log('Running offline mode');
  } else {
    console.log('Exiting!');
    process.exit();
  }
}

api.on("error", (err) => {
    console.error('Netatmo threw an error: ' + err);
    if (offline) {
      console.log('Running offline mode');
    } else {
      console.log('Exiting!');
      process.exit();
    }
});

api.on("warning", (err) => {
    console.log('Netatmo threw a warning: ' + err);
});

api.getStationsData( (err, devices) => {
  if (err) {
      console.log(err);
  }

  var modules = devices[0].modules;
  console.log(JSON.stringify(devices, undefined, 2));
  rain = modules[2].dashboard_data.Rain;
  console.log('Fetched new station data.:');
  //console.log(modules);

});
