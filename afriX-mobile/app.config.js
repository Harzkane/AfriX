const { expo: baseConfig } = require("./app.json");

module.exports = ({ config }) => {
  const androidGoogleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";
  const iosGoogleServicesFile =
    process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info-7.plist";

  return {
    ...baseConfig,
    ...config,
    ios: {
      ...baseConfig.ios,
      ...(config.ios || {}),
      googleServicesFile: iosGoogleServicesFile,
    },
    android: {
      ...baseConfig.android,
      ...(config.android || {}),
      googleServicesFile: androidGoogleServicesFile,
    },
  };
};
