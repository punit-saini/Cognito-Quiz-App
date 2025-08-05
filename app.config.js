module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
      APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    },
  };
};
