export const handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "https://d2r9mqov2jw8be.cloudfront.net", // frontend origin
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
    },
    body: "Hello from Lambda!"
  };
};