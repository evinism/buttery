import {
  ButteryFile,
  Reference,
  Service,
  VariableDeclaration,
  OneOfType,
} from "./ast";

import { left, right, Either } from "fp-ts/lib/Either";
import { every } from "fp-ts/lib/ReadonlyRecord";

// This enforces some constraints on Buttery files.
// These constraints shouldn't be considered part of the ast because they don't
// represent the syntax structure!
export function validate(
  file: ButteryFile<Reference>
): Either<ButteryFile<Reference>, Error> {
  // Constraint 1: Top level var declarations should not include channel and rpc
  // definitions
  const hasOnlyStructsAndServices = file.variables.every(
    (decl) => decl.value.type !== "rpc" && decl.value.type !== "channel"
  );
  if (!hasOnlyStructsAndServices) {
    return right(
      new Error(`${file.path} has rpc definitions outside of channels`)
    );
  }

  // Constraint 2: Service declarations should not include service declarations.
  const noNestedServices = (file.variables
    .map((decl) => decl.value)
    .filter((decl) => decl.type === "service") as Service<
    Reference
  >[]).every((service: Service<Reference>) =>
    service.variables.every(
      (varInService) => varInService.value.type !== "service"
    )
  );

  if (!noNestedServices) {
    return right(new Error(`Cannot nest services`));
  }

  // Ugh we need to figure out something better for this, but...
  // constraint: oneofs can't have optional fields
  const oneOfFields = file.variables
    .map((entry) => {
      if (entry.value.type === "oneof") {
        return [entry.value];
      } else if (entry.value.type === "service") {
        return entry.value.variables
          .map((decl) => decl.value)
          .filter((item) => item.type === "oneof") as OneOfType<Reference>[];
      }
      return [];
    })
    .reduce((acc, cur) => [...acc, ...cur], [])
    .map((item) => item.fields)
    .reduce((acc, cur) => [...acc, ...cur], []);

  if (oneOfFields.some((field) => field.optional)) {
    return right(new Error("Cannot use optional value in oneof declaration"));
  }

  // Constraint 3: There can't be repeated variable names
  const ensureNoRepeats = (variables: VariableDeclaration<unknown>[]) => {
    const acc: { [key: string]: boolean } = {};
    for (let { name } of variables) {
      if (acc[name]) {
        throw new Error(`Repeated variable ${name} in ${file.path}`);
      }
      acc[name] = true;
    }
  };

  try {
    ensureNoRepeats(file.variables);
    file.variables
      .filter((decl) => decl.value.type === "service")
      .forEach((decl) => {
        ensureNoRepeats((decl.value as Service<unknown>).variables);
      });
  } catch (e) {
    return right(e);
  }

  return left(file);
}
