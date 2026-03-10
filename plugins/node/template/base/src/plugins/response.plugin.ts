
import fp from "fastify-plugin";
import { successResponse } from "../shared/utils";

export default fp(async function (fastify) {
  fastify.decorateReply("success", function (data, message) {
    return this.send(successResponse(data, message))
  }),
    fastify.decorateReply("created", function (data) {
      return this.status(201).send({
        success: true,
        data
      });
    }),
    fastify.decorateReply("paginated", function (data, meta) {
      return this.send({
        data,
        meta
      })
    }),
    fastify.decorateReply("noContent", function () {
      return this.status(204).send();
    })
})
