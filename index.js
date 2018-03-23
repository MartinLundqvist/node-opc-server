// load the packages
const opcua = require('node-opcua');
const netatmo = require('netatmo');
const yargs = require('yargs');
const fs = require('fs');

// set constants
const logfileName = 'server.json';

// create and initialize the variables
var outdoorTemperature = 0;
var indoorTemperature = 0;
var rain = 0;
var brewFake = 0;

const argv = yargs
  .options({
    verbose: {
      demand: false,
      alias: 'v',
      describe: 'Chatty console',
      boolean: true,
      default: false
    },
    offline: {
      demand: false,
      alias: 'o',
      describe: 'Run in offline (no access to internet) mode',
      boolean: true,
      default: false
    },
    logfile: {
      demand: false,
      alias: 'l',
      describe: 'Save server.json output log',
      boolean: true,
      default: false
    },
    password: {
        demand: true,
        alias: 'p',
        describe: 'Netatmo password',
        string: true,
        default: ""
    }
  })
  .help()
  .alias('help','h')
  .argv;

var verbose = argv.v;
var offline = argv.o;
var logfile = argv.l;

//console.log(argv);

// Initialize and start the OPC UA server
var server = new opcua.OPCUAServer({
    port: 4334,
    resourcePath: "UA/martinsBrewedOPCServer"
    // serverInfo: {
    //     applicationUri: opcua.makeApplicationUrn(opcua.get_fully_qualified_domain_name(), "UA:martinsBrewedOPCServer"),
    //     productUri: ":4334/UA/martinsBrewedOPCServer",
    //     applicationName: {text: "martinsBrewedOPCServer" ,locale:"en"},
    //     gatewayServerUri: null,
    //     discoveryProfileUri: null,
    //     discoveryUrls: []
    // }
  });


//Initialize and start the Netatmo listener
var auth = {
  "client_id": "5aa3d9b18c04c4e6b18babf6",
  "client_secret": "kqDz15LYia78X9bymV12U7ogDsYDPKGkK4y6WnnikQ",
  "username": "iphonelynden@gmail.com",
  "password": argv.p
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

var readStationsData = () => {
  api.getStationsData( (err, devices) => {
    if (err) {
        console.log(err);
    }

    var modules = devices[0].modules;
    //console.log(JSON.stringify(modules, undefined, 2));
    outdoorTemperature = modules[0].dashboard_data.Temperature;
    indoorTemperature = modules[1].dashboard_data.Temperature;
    rain = modules[2].dashboard_data.Rain;
    if (verbose) {
      console.log('Fetched new station data.:');
      console.log(outdoorTemperature, indoorTemperature, rain);
    }
  });
}

// fetch new data from weather station every 10 mins (600000ms)
setInterval( () => {
  //debugger;
  readStationsData();


  //
  // api.getStationsData( (err, devices) => {
  //   if (err) {
  //       console.log(err);
  //   }
  //
  //   var modules = devices[0].modules;
  //   //console.log(JSON.stringify(modules, undefined, 2));
  //   outdoorTemperature = modules[0].dashboard_data.Temperature;
  //   indoorTemperature = modules[1].dashboard_data.Temperature;
  //   rain = modules[2].dashboard_data.Rain;
  //   if (verbose) {
  //     console.log('Fetched new station data.:');
  //     console.log(outdoorTemperature, indoorTemperature, rain);
  //   }
  //
  // });
}, 600000);

// update the fake variable with whatever every second
setInterval( () => {
  //debugger;

    brewFake = 1 + Math.sin(Date.now() / 10000);
    if (verbose) {
      console.log('Updated fake variable');
      console.log(brewFake);
    }

}, 1000);


//Configure OPC server address space
var construct_my_address_space = (server) => {

  var addressSpace = server.engine.addressSpace;

  // declare Netatmo station "Ekudden" as a server device
  var ekuddenDevice = addressSpace.addFolder(addressSpace.rootFolder.objects,{
    browseName: "Ekudden"
  });

  // declare  "Fake" as a server device
  var fakeDevice = addressSpace.addFolder(addressSpace.rootFolder.objects,{
    browseName: "Fake"
  });


  // create name space for each variable
  var ekuddenOutdoorTemperatureAS = addressSpace.addVariable({
    organizedBy: ekuddenDevice,
    nodeId: "ns=0;s=ekuddenOutdoorTemperature",
    browseName: "ekuddenOutdoorTemperature",
    dataType: "Double",
    value: {
        get: () => {
            return new opcua.Variant({
              dataType: opcua.DataType.Double,
              value: outdoorTemperature
            });
        }
    }
  });

  var ekuddenIndoorTemperatureAS = addressSpace.addVariable({
    organizedBy: ekuddenDevice,
    nodeId: "ns=0;s=ekuddenIndoorTemperature",
    browseName: "ekuddenIndoorTemperature",
    dataType: "Double",
    value: {
        get: () => {
            return new opcua.Variant({
              dataType: opcua.DataType.Double,
              value: indoorTemperature
            });
        }
    }
  });

  var ekuddenRainAS = addressSpace.addVariable({
    organizedBy: ekuddenDevice,
    nodeId: "ns=0;s=ekuddenRain",
    browseName: "ekuddenRain",
    dataType: "Double",
    value: {
        get: () => {
            return new opcua.Variant({
              dataType: opcua.DataType.Double,
              value: rain
            });
        }
    }
  });

  var brewFakeVariableAS = addressSpace.addVariable({
    organizedBy: fakeDevice,
    nodeId: "ns=0;s=brewFake",
    browseName: "brewFake",
    dataType: "Double",
    value: {
        get: () => {
            return new opcua.Variant({
              dataType: opcua.DataType.Double,
              value: brewFake
            });
        }
    }
  });



  // Push variable data to server every second
  setInterval( () => {

    ekuddenOutdoorTemperatureAS.setValueFromSource(
      new opcua.Variant({
        dataType: opcua.DataType.Double,
        value: outdoorTemperature
      }));

    ekuddenIndoorTemperatureAS.setValueFromSource(
      new opcua.Variant({
        dataType: opcua.DataType.Double,
        value: indoorTemperature
    }));


    ekuddenRainAS.setValueFromSource(
      new opcua.Variant({
        dataType: opcua.DataType.Double,
        value: rain
    }));

    brewFakeVariableAS.setValueFromSource(
      new opcua.Variant({
        dataType: opcua.DataType.Double,
        value: brewFake
    }));

    if (verbose) {
      console.log('Updated server variables.');
    }

  }, 1000);

}

server.initialize( () => {
  console.log('Initialized!');

  construct_my_address_space(server);

  console.log('Address space constructed!');
  if (verbose) { console.log(JSON.stringify(server.engine.addressSpace.rootFolder.objects, undefined,2)); }
  if (logfile) {
    fs.appendFile(logfileName, JSON.stringify(server.engine.addressSpace.rootFolder.objects, undefined, 2), (err) => {
      if(err) {
        console.log('Unable to write to ' + logfileName);
      }
    });
  }
});

server.start( (err) => {
  if (err) {
    console.log(`Error: ${err}`);
  }

  console.log("Server is now listening ... ( press CTRL+C to stop)");
  console.log(`... on : ${server.endpoints[0].endpointDescriptions()[0].endpointUrl}`);
  console.log("port ", server.endpoints[0].port);

  readStationsData();


});
