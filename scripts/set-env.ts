import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const envConfig = `
export const environment = {
  production: false,
  firebase: {
    apiKey: "${process.env['NG_APP_API_KEY']}",
    authDomain: "${process.env['NG_APP_AUTH_DOMAIN']}",
    projectId: "${process.env['NG_APP_PROJECT_ID']}",
    storageBucket: "${process.env['NG_APP_STORAGE_BUCKET']}",
    messagingSenderId: "${process.env['NG_APP_MESSAGING_SENDER_ID']}",
    appId: "${process.env['NG_APP_APP_ID']}",
    measurementId: "${process.env['NG_APP_MEASUREMENT_ID']}",
  }
};
`;

fs.writeFileSync(
  "./src/environments/environment.ts",
  envConfig
);
fs.writeFileSync(
  "./src/environments/environment.development.ts",
  envConfig
);
