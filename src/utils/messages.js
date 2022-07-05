const generateMessage = (username, text) => {
  return {
    text,
    username: username.replace(/(\b[a-z](?!\s))/g, (str) => str.toUpperCase()),
    createdAt: new Date().getTime()
  };
};

const generateLocationMessage = (username, url) => {
  return {
    url,
    username: username.replace(/(\b[a-z](?!\s))/g, (str) => str.toUpperCase()),
    createdAt: new Date().getTime()
  };
};

module.exports = {
  generateMessage,
  generateLocationMessage
};