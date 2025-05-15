export default function handler(req, res) {
  res.status(200).json({
    message: "✅ Custom Activity SFMC pronta! 1.0.1",
    endpoints: {
      config: "/config.json",
      publish: "/api/publish",
      execute: "/api/execute",
      validate: "/api/validate",
      stop: "/api/stop"
    }
  });
}
