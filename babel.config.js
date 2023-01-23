module.exports = api => {
  const isTest = api.env('test');
  // You can use isTest to determine what presets and plugins to use.

  if (isTest) {
    return {
      presets: ['module:metro-react-native-babel-preset'],
    };
  }

  return {};
};
