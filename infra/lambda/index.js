export const handler = async (event) => {

  const data = [
    { title: "Backend Card 1", description: "This card comes from the backend." },
    { title: "Backend Card 2", description: "Stateless serverless example." },
    { title: "Backend Card 3", description: "Rendered dynamically by frontend." }
  ];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(data)
  };
};