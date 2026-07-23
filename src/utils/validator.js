import Joi from '@hapi/joi';

export const schema = Joi.object({
  jid: Joi.string().required(),
  command: Joi.string().required(),
  args: Joi.array().items(Joi.string())
});

export function validateMessage(payload) {
  return schema.validate(payload);
}
