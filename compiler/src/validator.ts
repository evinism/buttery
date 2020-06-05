import { SurpcFile, Reference, Service } from "./ast";

// This enforces some constraints on Sur files.
// These constraints shouldn't be considered part of the ast because they're
// likely to change! Is that a good choice? Idk. It seems reasonable to me.
export function validate(file: SurpcFile<Reference>): SurpcFile<Reference> {
  // Constraint 1: Top level var declarations should not include channel and rpc
  // definitions
  const hasOnlyStructsAndServices = file.variables.every(
    (decl) => decl.value.type !== "rpc" && decl.value.type !== "channel"
  );
  if (!hasOnlyStructsAndServices) {
    throw `${file.path} has rpc definitions outside of channels`;
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
    throw `Cannot nest services`;
  }

  return file;
}
