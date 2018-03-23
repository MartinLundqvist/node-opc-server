const endpointUrl = "opc.tcp://Martins-MacBook-Pro.local:4334/UA/martinsBrewedOPCServer";

const opcua = require("node-opcua");
const AttributeIds = opcua.AttributeIds;
const OPCUAClient = opcua.OPCUAClient;

(async function main(){

    const client = new OPCUAClient({});
    await client.connect(endpointUrl);
    const session = await client.createSession();

    const dataValue = await session.read({nodeId: "ns=0;s=ekuddenTemperature",attributeId: AttributeIds.Value});
    console.log(`Temperature is ${dataValue.value.value.toPrecision(3)}°C.`);

    await client.closeSession(session,true);
    await client.disconnect();

})();
