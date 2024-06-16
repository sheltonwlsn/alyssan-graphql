# GraphQL Service with Apollo and Express.js

This is a GraphQL service built with Apollo and Express.js. It uses Prisma and TypeGraphQL to generate code for reading and writing to a MongoDB database.

## Prerequisites

Before running this service, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB

## Getting Started

1. Clone this repository:

   ```bash
   git clone <repository-url>
   ```

2. Install the dependencies:

   ```bash
   cd <repository-folder>
   npm install
   ```

3. Set up the MongoDB connection:

   - Open the `.env` file and update the `MONGODB_URL` variable with your MongoDB connection URL.

4. Generate Prisma client:

   ```bash
   npx prisma generate
   ```

5. Start the server:

   ```bash
   npm start
   ```

   The server will start running on `http://localhost:4000/graphql`.

## Usage

You can use a GraphQL client (e.g., [GraphQL Playground](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/)) to interact with the GraphQL API.

The available GraphQL operations and types are automatically generated based on the Prisma models and TypeGraphQL decorators. You can find the generated code in the `src/generated` folder.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
