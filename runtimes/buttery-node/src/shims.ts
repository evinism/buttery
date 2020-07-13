import * as http from "http";
import { Socket } from "net";

type UpgradeTag = {
  socket: Socket;
  head: Buffer;
};

type ResponseHandler = (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => unknown;

type UpgradeHandler = (
  req: http.IncomingMessage,
  socket: Socket,
  head: Buffer
) => unknown;

const Buttery_UPGRADE_REQUEST_KEY_NAME = "__buttery_upgrade__";

type RequestWithUpgradeTag = http.IncomingMessage & {
  [Buttery_UPGRADE_REQUEST_KEY_NAME]?: UpgradeTag;
};

// responseHandlerToUpgradeHandler creates the server response.
export const responseHandlerToUpgradeHandler = (
  responseHandler: ResponseHandler
): UpgradeHandler => (req: RequestWithUpgradeTag, socket, head) => {
  // We use a response that's to be used on rejection. If the upgrade
  // request gets to the upgrade, then this is thrown away.
  const dummyResponse: http.ServerResponse = new http.ServerResponse(req);
  dummyResponse.assignSocket(socket);

  req[Buttery_UPGRADE_REQUEST_KEY_NAME] = {
    socket,
    head,
  };
  responseHandler(req, dummyResponse);
};

// upgradeHandlerToResponseHandler handles the server response if necessary.
export const upgradeHandlerToResponseHandler = (
  upgradeHandler: UpgradeHandler
): ResponseHandler => (
  req: RequestWithUpgradeTag,
  res: http.ServerResponse
) => {
  const upgradeTag = req[Buttery_UPGRADE_REQUEST_KEY_NAME];
  if (!upgradeTag) {
    throw "Tried to convert a non-upgrade response to an upgrade handler!";
  }
  if (req.method !== "GET") {
    throw "Tried to use a non-get query for an upgrade handler!";
  }
  const { socket, head } = upgradeTag;
  upgradeHandler(req, socket, head);
};

export const divertUpgrade = (
  nonUpgrade: ResponseHandler,
  upgrade: ResponseHandler
): ResponseHandler => (
  req: RequestWithUpgradeTag,
  res: http.ServerResponse
) => {
  if (req[Buttery_UPGRADE_REQUEST_KEY_NAME]) {
    upgrade(req, res);
  } else {
    nonUpgrade(req, res);
  }
};
