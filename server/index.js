import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { refreshTokens } from './utils/auth';

import models from './models';

const SECRET = 'fenbvlqbl25r23qtq';
const SECRET2 = 'veaivguqbvaqbvqjb21j4b21jkbr13jkqbf2jq';

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));

const resolvers = mergeResolvers(fileLoader(path.join(__dirname, './resolvers')));

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

const addUser = async (req, res, next) => {
  const token = req.headers['x-token'];
  if (token) {
    try {
      const { user } = jwt.verify(token, SECRET);
      req.user = user;
    } catch (err) {
      const refreshToken = req.headers['x-refresh-token'];
      const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
      if (newTokens.token && newTokens.refreshToken) {
        res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
        res.set('x-token', newTokens.token);
        res.set('x-refresh-token', newTokens.refreshToken);
      }
      req.user = newTokens.user;
    }
  }
  next();
};

const app = express();
app.use(cors(corsOptions));
app.use(addUser);

const graphqlEndpoint = '/graphql';

// Context to get models of sequelize to our resolvers
app.use(
  graphqlEndpoint, bodyParser.json(),
  graphqlExpress((req) => ({
    schema,
    context: {
      models, user: req.user, SECRET, SECRET2,
    },
  }))
);

app.use('/graphiql', graphiqlExpress({ endpointURL: graphqlEndpoint }));

models.sequelize.sync().then(() => {
  app.listen(8080);
});

app.listen(8081);
