const { withEntitlementsPlist } = require("@expo/config-plugins");
const { expo: baseConfig } = require("./app.json");

const removeApsPlugin = (config) => {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};

module.exports = ({ config }) => {
  const androidGoogleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";
  const iosGoogleServicesFile =
    process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info-7.plist";

  const finalConfig = {
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

  return removeApsPlugin(finalConfig);
};
