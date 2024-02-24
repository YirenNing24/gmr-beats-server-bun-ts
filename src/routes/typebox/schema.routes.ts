import { Type, Static } from "@sinclair/typebox";
import { validatorFactory } from "./validator.routes";

  export const beatsLoginSchema = Type.Object({
    username: Type.String(),
    password: Type.String()
  });


  

export type BeatsLoginSchemaType = Static<typeof beatsLoginSchema>
export const loginValidation = validatorFactory<BeatsLoginSchemaType>(beatsLoginSchema);