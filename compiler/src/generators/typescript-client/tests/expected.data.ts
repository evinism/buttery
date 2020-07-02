import {ButteryClient, structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode, optionalNode, buildRpcHandler, buildChannelHandler, ButteryChannelConnection} from './buttery.runtime';

export const Person = structNode({name: stringNode(), pronouns: listNode(stringNode())});
export const Slot = structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()});
export const AddToPartyResponse = structNode({success: booleanNode(), time: optionalNode(structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()}))});
export const ChatMessage = structNode({time: integerNode(), content: stringNode()});
export const ChatUpdate = structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})});
export const PartyService = (() => {
  const AddToParty = { type: "rpcNode" as "rpcNode", name: "AddToParty" as "AddToParty", request: structNode({name: stringNode(), pronouns: listNode(stringNode())}), response: structNode({success: booleanNode(), time: optionalNode(structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()}))})};
  const Chat = { type: "channelNode" as "channelNode", name: "Chat" as "Chat",incoming: structNode({time: integerNode(), content: stringNode()}), outgoing: structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})})};
  return {name: "PartyService" as "PartyService", endpoints: {AddToParty, Chat}};
})();

export class PartyServiceClient extends ButteryClient {
  serviceName = "PartyService";
  AddToParty = buildRpcHandler("AddToParty", PartyService.endpoints.AddToParty.request, PartyService.endpoints.AddToParty.response);
  Chat = buildChannelHandler("Chat", PartyService.endpoints.Chat.incoming, PartyService.endpoints.Chat.outgoing);
}

