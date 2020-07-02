const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Required due to https://github.com/facebook/create-react-app/issues/6497
  // As soon as CRA fixes this issue for websockets, this shouldnt be necessary
  app.use(
    "/__buttery__",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      ws: true,
    })
  );
};
