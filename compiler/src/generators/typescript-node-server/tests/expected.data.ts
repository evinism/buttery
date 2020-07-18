import {structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode, optionalNode, oneOfNode, mapNode, ExtractNodeType} from 'buttery-node/dist/shared/nodes';

const Person__node = structNode({name: stringNode(), pronouns: listNode(stringNode())});
export type Person = ExtractNodeType<typeof Person__node>;
const Slot__node = structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()});
export type Slot = ExtractNodeType<typeof Slot__node>;
const AddToPartyResponse__node = structNode({success: booleanNode(), time: optionalNode(structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()}))});
export type AddToPartyResponse = ExtractNodeType<typeof AddToPartyResponse__node>;
const ChatMessage__node = structNode({time: integerNode(), content: stringNode()});
export type ChatMessage = ExtractNodeType<typeof ChatMessage__node>;
const ChatUpdate__node = structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})});
export type ChatUpdate = ExtractNodeType<typeof ChatUpdate__node>;
export namespace PartyService {
  const AddToParty__node = { type: "rpcNode" as "rpcNode", name: "AddToParty" as "AddToParty", request: structNode({name: stringNode(), pronouns: listNode(stringNode())}), response: structNode({success: booleanNode(), time: optionalNode(structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()}))})};
  export type AddToParty = ExtractNodeType<typeof AddToParty__node>;
  const Chat__node = { type: "channelNode" as "channelNode", name: "Chat" as "Chat",incoming: structNode({time: integerNode(), content: stringNode()}), outgoing: structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})})};
  export type Chat = ExtractNodeType<typeof Chat__node>;
  export const name = "PartyService" as "PartyService"
  export const endpoints = {AddToParty: AddToParty__node, Chat: Chat__node};
}
