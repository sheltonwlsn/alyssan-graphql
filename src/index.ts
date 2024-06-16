import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { prisma, Context } from "./context";

import { resolvers, applyResolversEnhanceMap, applyInputTypesEnhanceMap, SYSTEM_ROLE } from "./shared/typegraphql";
import { buildSchema, AuthChecker, Authorized } from "type-graphql";

import express from 'express';
import { createServer } from 'http';

import { applicationDefault, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth";

const userCreateOrUpdateOperations = [
  "createPostReview",
  "createComment",
  "updateComment",
  "createReply",
]

const firebaseApp = initializeApp({
  credential: applicationDefault(),
})

const auth = getAuth(firebaseApp);

const port = process.env.PORT || 4000;
const environment = "dev";

const getCorsConfig = () => { 
  // if (environment === "prod") {
  //   return ({
  //     "origin": [/vestiairecollective\.com/],
  //     "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  //     "preflightContinue": false,
  //     "optionsSuccessStatus": 204
  //   })
  // }

  return ({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  })
};

applyResolversEnhanceMap({
  User: {
    upsertOneUser: [Authorized()],
    createOneUser: [Authorized()],
    updateOneUser: [Authorized()],
    users: [Authorized()],
    deleteOneUser: [Authorized()],
    deleteManyUser: [Authorized()],
  },
  Tenant: {
    createOneTenant: [Authorized()],
    updateOneTenant: [Authorized(SYSTEM_ROLE.SUPER_ADMIN, SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.WORKSPACE_ADMIN)],
    deleteOneTenant: [Authorized(SYSTEM_ROLE.SUPER_ADMIN, SYSTEM_ROLE.ADMIN, SYSTEM_ROLE.WORKSPACE_OWNER)],
    createManyTenant: [Authorized(SYSTEM_ROLE.SUPER_ADMIN, SYSTEM_ROLE.ADMIN)],
    updateManyTenant: [Authorized(SYSTEM_ROLE.SUPER_ADMIN, SYSTEM_ROLE.ADMIN)],
    deleteManyTenant: [Authorized(SYSTEM_ROLE.SUPER_ADMIN, SYSTEM_ROLE.ADMIN)],
  },
  NotificationSettings: {
    _all: [Authorized()]
  },
  Document: {
    createOneDocument: [Authorized()],
    updateOneDocument: [Authorized()],
    createManyDocument: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    updateManyDocument: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    deleteOneDocument: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    deleteManyDocument: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
  },
  Connection: {
    createOneConnection: [Authorized()],
    updateOneConnection: [Authorized()],
    createManyConnection: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    updateManyConnection: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    deleteOneConnection: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    deleteManyConnection: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
  },
  Namespace: {
    createOneNamespace: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    updateOneNamespace: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    createManyNamespace: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    updateManyNamespace: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    deleteOneNamespace: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
    deleteManyNamespace: [Authorized(SYSTEM_ROLE.WORKSPACE_OWNER, SYSTEM_ROLE.ADMIN)],
  },
  Comment: {
    createOneComment: [Authorized()],
    updateOneComment: [Authorized()],
    createManyComment: [Authorized(SYSTEM_ROLE.ADMIN)],
    updateManyComment: [Authorized(SYSTEM_ROLE.ADMIN)],
    deleteOneComment: [Authorized()],
    deleteManyComment: [Authorized(SYSTEM_ROLE.ADMIN)],
  },
  Reply: {
    createOneReply: [Authorized()],
    updateOneReply: [Authorized()],
    createManyReply: [Authorized(SYSTEM_ROLE.ADMIN)],
    updateManyReply: [Authorized(SYSTEM_ROLE.ADMIN)],
    deleteOneReply: [Authorized()],
    deleteManyReply: [Authorized(SYSTEM_ROLE.ADMIN)],
  },
  Reaction: {
    createOneReaction: [Authorized()],
    updateOneReaction: [Authorized()],
    createManyReaction: [Authorized(SYSTEM_ROLE.ADMIN)],
    updateManyReaction: [Authorized(SYSTEM_ROLE.ADMIN)],
    deleteOneReaction: [Authorized()],
    deleteManyReaction: [Authorized(SYSTEM_ROLE.ADMIN)],
  },
  Notification: {
    notification: [Authorized()],
    notifications: [Authorized()],
    createOneNotification: [Authorized()],
    updateOneNotification: [Authorized()],
    createManyNotification: [Authorized(SYSTEM_ROLE.ADMIN)],
    updateManyNotification: [Authorized(SYSTEM_ROLE.ADMIN)],
    deleteOneNotification: [Authorized()],
    deleteManyNotification: [Authorized(SYSTEM_ROLE.ADMIN)],
  },

})

const authChecker: AuthChecker<Context> = async ({ context, args, info }, roles) => {
  return true

  // TODO: add auth check code for given provider.
  const requestToken = (context.authHeader || '').replace('Bearer ', '');

  try {
    const decodedToken = await auth.verifyIdToken(requestToken);
    const { uid } = decodedToken;

    const user = await prisma.user.findUnique({
      where: {
        id: uid
      }
    });
    
    if ((uid && info.fieldName === "createUser") || (uid && info.fieldName === "upsertUser")) {
      return true;
    }

    if (roles.length === 0 || (user?.systemRoles.length && roles.some(r => user?.systemRoles.map(i => i.toString()).includes(r)))) {
      return true;
    }

    if (!uid) { 
      throw new Error("Firebase user not found");
    }


    if (!user) {
      throw new Error("User not found");
    }

    if (userCreateOrUpdateOperations.includes(info.fieldName) && user?.id !== args.data.Author.connect.id) {
      throw new Error("user/invalid");
    }


  } catch (err) { 
    if (err?.code === "auth/id-token-expired") {
      throw new Error("Token expired");
    }

    if (err?.message === "user/invalid") {
      throw new Error("Unauthorized: You can only perform this operation on your own content");
    }
    console.log(err)
  }

  return false;
}

(async () => {
  const schema = await buildSchema({
    authChecker,
    resolvers,
    validate: false,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }): Context => ({
      prisma,
      authHeader: req.header("authorization") || "",
    }),
  });

  const expressApp = express();
  const httpServer = createServer(expressApp);

  expressApp.get('/healthz', (req, res) => {
    res.send('OK');
  });
  
  expressApp.get('/robots.txt', (req, res) => { 
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /');
  });

  await server.start();
  server.applyMiddleware({
    app: expressApp,
    path: '/',
    cors: getCorsConfig()
  });

  httpServer.listen(port, () => {
    console.log("Server running at: ", `http://localhost:${port}${server.graphqlPath}`, ` in ${environment} mode`)
  })
})();
