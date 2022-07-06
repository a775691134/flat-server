import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { JWT, Server } from "../../constants/Config";
import { Status } from "../../constants/Project";
import { FastifyReply, FastifyRequest } from "fastify";
import { ErrorCode } from "../../ErrorCode";
import { loggerServer, parseError } from "../../logger";
import { Algorithm } from "fast-jwt";

export default fp(async (fastify): Promise<void> => {
    await fastify.register(jwt, {
        secret: JWT.secret,
        sign: {
            algorithm: JWT.algorithms as Algorithm,
            iss: Server.name,
            expiresIn: "29 days",
        },
    });

    fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            loggerServer.warn("jwt verify failed", parseError(err));
            void reply.send({
                status: Status.Failed,
                code: ErrorCode.JWTSignFailed,
            });
        }
    });
});