let RainbowSDK = require("rainbow-node-sdk");
require("dotenv").config();
import dialogflow from "dialogflow";

// intel for connection
const options = {
  rainbow: {
    host: "sandbox" // Can be "sandbox" (developer platform), "official" or any other hostname when using dedicated AIO<br>
  },
  credentials: {
    login: process.env.RAINBOW_USER,
    password: process.env.RAINBOW_PASSWORD
  },
  // Application identifier : Application is mandatory to connect official Rainbow System.
  application: {
    appID: process.env.RAINBOW_APP_ID,
    appSecret: process.env.RAINBOW_APP_SECRET 
  },
  logs: {
    enableConsoleLogs: false,
    enableFileLogs: false,
    file: {
      path: "/var/tmp/rainbowsdk/",
      level: "debug"
    }
  },
  // IM options
  im: {
    sendReadReceipt: true
  }
};
const projectId = process.env.GCP_PROJECT_ID;

async function runChatbot(projectId, query, message, callback) {
  const sessionId = "123458";
  const credentials_file_path = process.env.PATH_OF_GCP_CREDS;
  const sessionClient = new dialogflow.SessionsClient({
    projectId,
    keyFilename: credentials_file_path
  });

  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: "en-US"
      }
    }
  };

  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
  console.log("Detected intent by Agent Dialogflow and answer");
  console.log(responses);
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);

  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
    callback(result.fulfillmentText);
  } else {
    console.log(`  No intent matched.`);
  }
}

let rainbowSDK = new RainbowSDK(options);

rainbowSDK.start().then(() => {
  console.log("The chatbot is started");
  rainbowSDK.events.on("rainbow_onmessagereceived", message => {
    console.log(
      `${message.conversation.contact._displayName}: ${message.content}`
    );
    runChatbot(projectId, message.content, "", res => {
      rainbowSDK.im
        .sendMessageToJid(res, message.fromJid)
        .then(console.log("We sent the response"));
    });
  });
  rainbowSDK.events.on("rainbow_onmessagereceiptreceived", receipt => {
    console.log(receipt);
  });
});

// Some examples for calling the bot
/*
runChatbot(projectId, "What's up", "", res => {
  rainbowSDK.im
    .sendMessageToJid(res, message.fromJid)
    .then(console.log("We sent the response"));
});

runChatbot(projectId, "Hello", "", res => {
  rainbowSDK.im
    .sendMessageToJid(res, message.fromJid)
    .then(console.log("We sent the response"));
});
*/