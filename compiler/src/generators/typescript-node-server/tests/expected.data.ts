import {structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode} from 'butter-node/dist/shared/nodes';

export const Slot = structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()});
export const AddToPartyResponse = structNode({success: booleanNode(), time: structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()})});
export const ChatMessage = structNode({time: integerNode(), content: stringNode()});
export const ChatUpdate = structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})});
export const AddToParty = { type: "rpcNode" as "rpcNode", name: "AddToParty", request: structNode({name: stringNode(), pronouns: listNode(stringNode())}), response: structNode({success: booleanNode(), time: structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()})})};
export const Chat = { type: "channelNode" as "channelNode", name: "Chat",incoming: structNode({time: integerNode(), content: stringNode()}), outgoing: structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})})};
export const PartyService = {name: "PartyService", endpoints: {AddToParty, Chat}};
