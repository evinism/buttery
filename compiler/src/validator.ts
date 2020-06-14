import { SurFile, Reference, Service, VariableDeclaration } from "./ast";

import { left, right, Either } from "fp-ts/lib/Either";

// This enforces some constraints on Sur files.
// These constraints shouldn't be considered part of the ast because they don't
// represent the syntax structure!
export function validate(
  file: SurFile<Reference>
): Either<SurFile<Reference>, Error> {
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
  const noNestedServices = file.variables
    .map((decl) => decl.value)
    .filter((decl) => decl.type === "service")
    .every((service: Service<Reference>) =>
      service.variables.every(
        (varInService) => varInService.value.type !== "service"
      )
    );

  if (!noNestedServices) {
    return right(new Error(`Cannot nest services`));
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
