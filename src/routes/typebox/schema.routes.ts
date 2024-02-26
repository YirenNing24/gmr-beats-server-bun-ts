import { Type, Static } from "@sinclair/typebox";
import { validatorFactory } from "./validator.routes";
import { t } from "elysia";
  export const beatsLoginSchema = Type.Object({
    username: Type.String(),
    password: Type.String()
  });


export const userSchema = {
    body: t.Object({ userName: t.String(), password: t.String()})
}

export type BeatsLoginSchemaType = Static<typeof beatsLoginSchema>
export const loginValidation = validatorFactory<BeatsLoginSchemaType>(beatsLoginSchema);