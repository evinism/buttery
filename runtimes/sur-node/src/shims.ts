import * as http from "http";
import { Socket } from "net";

type ResponseHandler = (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => unknown;

type UpgradeHandler = (
  req: http.IncomingMessage,
  socket: Socket,
  head: Buffer
) => unknown;

const SUR_UPGRADE_REQUEST_KEY_NAME = "__sur_upgrade__";

// responseHandlerToUpgradeHandler creates the server response.
export const responseHandlerToUpgradeHandler = (
  responseHandler: ResponseHandler
): UpgradeHandler => (req, socket, head) => {
  // We use a response that's to be used on rejection. If the upgrade
  // request gets to the upgrade, then this is thrown away.
  const dummyResponse = new http.ServerResponse(req);
  dummyResponse.assignSocket(socket);

  req[SUR_UPGRADE_REQUEST_KEY_NAME] = {
    socket,
    head,
  };
  responseHandler(req, dummyResponse);
};

// upgradeHandlerToResponseHandler handles the server response if necessary.
export const upgradeHandlerToResponseHandler = (
  upgradeHandler: UpgradeHandler
): ResponseHandler => (req, res) => {
  if (!req[SUR_UPGRADE_REQUEST_KEY_NAME]) {
    throw "Tried to convert a non-upgrade response to an upgrade handler!";
  }
  const socket = req[SUR_UPGRADE_REQUEST_KEY_NAME].socket as Socket;
  const head = req[SUR_UPGRADE_REQUEST_KEY_NAME].socket as Buffer;
  upgradeHandler(req, socket, head);
};

export const divertUpgrade = (
  nonUpgrade: ResponseHandler,
  upgrade: ResponseHandler
): ResponseHandler => (req, res) => {
  if (req[SUR_UPGRADE_REQUEST_KEY_NAME]) {
    upgrade(req, res);
  } else {
    nonUpgrade(req, res);
  }
};
